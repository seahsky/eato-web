import Foundation

protocol URLSessionProtocol: Sendable {
    func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: URLSessionProtocol {}

actor APIClient {
    private let baseURL: URL
    private let session: URLSessionProtocol
    private let interceptor: AuthInterceptor

    init(
        baseURL: URL = AppConfig.apiBaseURL,
        session: URLSessionProtocol = URLSession.shared,
        interceptor: AuthInterceptor
    ) {
        self.baseURL = baseURL
        self.session = session
        self.interceptor = interceptor
    }

    func send<Response: Decodable>(_ endpoint: Endpoint<Response>) async throws -> Response {
        var retry = 0
        while true {
            let request = try await makeRequest(for: endpoint)
            let (data, response) = try await perform(request)
            switch response.statusCode {
            case 200..<300:
                if Response.self == EmptyResponse.self {
                    return EmptyResponse() as! Response
                }
                do {
                    return try JSONDecoder.eato.decode(Response.self, from: data)
                } catch {
                    throw APIError.decoding
                }
            case 401:
                let shouldRetry = try await interceptor.handleUnauthorized(retryCount: retry)
                if !shouldRetry { throw APIError.unauthorized }
                retry += 1
            case 404:
                throw APIError.notFound
            case 400..<600:
                let message = (try? JSONDecoder.eato.decode(ServerErrorBody.self, from: data))?
                    .bestMessage ?? "Something went wrong (\(response.statusCode))."
                throw APIError.server(message: message)
            default:
                throw APIError.server(message: "Unexpected status \(response.statusCode).")
            }
        }
    }

    private func makeRequest<R>(for endpoint: Endpoint<R>) async throws -> URLRequest {
        guard
            var components = URLComponents(
                url: baseURL.appendingPathComponent(endpoint.path),
                resolvingAgainstBaseURL: false
            )
        else { throw APIError.server(message: "Invalid URL") }
        if !endpoint.query.isEmpty {
            components.queryItems = endpoint.query
        }
        guard let url = components.url else {
            throw APIError.server(message: "Invalid URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body = endpoint.body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        await interceptor.authorize(&request)
        return request
    }

    private func perform(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.server(message: "Non-HTTP response")
            }
            return (data, http)
        } catch is URLError {
            throw APIError.network
        }
    }
}

struct EmptyResponse: Decodable, Sendable {}
