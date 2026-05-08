import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

struct Endpoint<Response: Decodable> {
    let method: HTTPMethod
    let path: String
    let query: [URLQueryItem]
    let body: Data?

    init(
        method: HTTPMethod,
        path: String,
        query: [URLQueryItem] = [],
        body: Data? = nil
    ) {
        self.method = method
        self.path = path
        self.query = query
        self.body = body
    }
}

extension Endpoint {
    static func get(_ path: String, query: [URLQueryItem] = []) -> Endpoint<Response> {
        .init(method: .get, path: path, query: query)
    }

    static func post<Body: Encodable>(
        _ path: String,
        body: Body,
        query: [URLQueryItem] = []
    ) -> Endpoint<Response> {
        let data = try? JSONEncoder.eato.encode(body)
        return .init(method: .post, path: path, query: query, body: data)
    }

    static func put<Body: Encodable>(
        _ path: String,
        body: Body,
        query: [URLQueryItem] = []
    ) -> Endpoint<Response> {
        let data = try? JSONEncoder.eato.encode(body)
        return .init(method: .put, path: path, query: query, body: data)
    }
}

extension JSONEncoder {
    // Backend Zod schemas (and the generated OpenAPI spec) use camelCase keys,
    // so the encoder must keep property names as-is. Do NOT enable
    // `.convertToSnakeCase` here — it would silently drop multi-word fields
    // like `imageUrl`, `consumedAt`, `mealGroupId` on the wire.
    static let eato: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()
}

extension JSONDecoder {
    static let eato: JSONDecoder = {
        let d = JSONDecoder()
        // Backend returns camelCase (tRPC default), not snake_case. Keep raw.
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            if let date = iso.date(from: raw) ?? plain.date(from: raw) { return date }
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unexpected date: \(raw)"
            )
        }
        return d
    }()
}
