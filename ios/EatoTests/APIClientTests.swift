import XCTest
@testable import Eato

final class APIClientTests: XCTestCase {
    func test_get_happyPath_decodesResponse() async throws {
        let session = MockSession(
            response: HTTPURLResponse(statusCode: 200),
            data: Data(#"{"id":"u1","clerkId":"ck","email":"a@b.c","profileCompleted":true}"#.utf8)
        )
        let client = APIClient(
            baseURL: URL(string: "https://eato.test/api/rest/")!,
            session: session,
            interceptor: AuthInterceptor(provider: StaticToken(token: "abc"))
        )
        let user = try await client.send(AuthAPI.me)
        XCTAssertEqual(user.id, "u1")
        XCTAssertEqual(await session.lastRequest?.value(forHTTPHeaderField: "Authorization"), "Bearer abc")
    }

    func test_get_401_retriesOnce_thenSignsOut() async throws {
        let session = MockSession(sequence: [
            .init(status: 401, data: Data()),
            .init(status: 401, data: Data()),
        ])
        let provider = CountingTokenProvider()
        let client = APIClient(
            baseURL: URL(string: "https://eato.test/api/rest/")!,
            session: session,
            interceptor: AuthInterceptor(provider: provider)
        )
        do {
            _ = try await client.send(AuthAPI.me)
            XCTFail("Should have thrown")
        } catch APIError.unauthorized {
            let refreshes = await provider.refreshCount
            let signOuts = await provider.signOutCount
            XCTAssertEqual(refreshes, 1, "should refresh exactly once")
            XCTAssertEqual(signOuts, 1, "should force sign out after 2nd 401")
        }
    }

    func test_404_mapsToNotFound() async throws {
        let session = MockSession(
            response: HTTPURLResponse(statusCode: 404),
            data: Data()
        )
        let client = APIClient(
            baseURL: URL(string: "https://eato.test/api/rest/")!,
            session: session,
            interceptor: AuthInterceptor(provider: StaticToken(token: nil))
        )
        do {
            _ = try await client.send(AuthAPI.me)
            XCTFail("Should have thrown")
        } catch APIError.notFound {
            // expected
        }
    }

    func test_500_withBody_surfacesServerMessage() async throws {
        let session = MockSession(
            response: HTTPURLResponse(statusCode: 500),
            data: Data(#"{"message":"kaboom"}"#.utf8)
        )
        let client = APIClient(
            baseURL: URL(string: "https://eato.test/api/rest/")!,
            session: session,
            interceptor: AuthInterceptor(provider: StaticToken(token: nil))
        )
        do {
            _ = try await client.send(AuthAPI.me)
            XCTFail("Should have thrown")
        } catch APIError.server(let message) {
            XCTAssertEqual(message, "kaboom")
        }
    }
}

// MARK: - Test doubles

private extension HTTPURLResponse {
    convenience init(statusCode: Int) {
        self.init(
            url: URL(string: "https://eato.test")!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: nil
        )!
    }
}

private actor MockSession: URLSessionProtocol {
    struct ScriptedResponse {
        let status: Int
        let data: Data
    }

    private var scripted: [ScriptedResponse]
    private(set) var lastRequest: URLRequest?

    init(sequence: [ScriptedResponse]) { self.scripted = sequence }
    init(response: HTTPURLResponse, data: Data) {
        self.scripted = [.init(status: response.statusCode, data: data)]
    }

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        let next = scripted.isEmpty ? .init(status: 500, data: Data()) : scripted.removeFirst()
        return (next.data, HTTPURLResponse(statusCode: next.status))
    }
}

private struct StaticToken: AuthTokenProvider {
    let token: String?
    func token() async -> String? { token }
    func refresh() async throws {}
    func forceSignOut() async {}
}

private actor CountingTokenProvider: AuthTokenProvider {
    private(set) var refreshCount = 0
    private(set) var signOutCount = 0
    func token() async -> String? { "token" }
    func refresh() async throws { refreshCount += 1 }
    func forceSignOut() async { signOutCount += 1 }
}
