import XCTest
@testable import Eato

@MainActor
final class FoodSearchViewModelTests: XCTestCase {
    func test_shortQuery_doesNotFire() async throws {
        let session = RecordingSession(response: Data(#"{"products":[]}"#.utf8))
        let vm = FoodSearchViewModel(api: makeAPI(session: session))
        vm.query = "a"
        try await Task.sleep(nanoseconds: 500_000_000)
        let count = await session.requestCount
        XCTAssertEqual(count, 0)
    }

    func test_longQuery_hitsSearchEndpoint() async throws {
        let session = RecordingSession(
            response: Data(#"{"products":[{"id":"1","name":"Banana"}]}"#.utf8)
        )
        let vm = FoodSearchViewModel(api: makeAPI(session: session))
        vm.query = "banana"
        try await Task.sleep(nanoseconds: 500_000_000)
        XCTAssertEqual(vm.results.first?.name, "Banana")
        let url = await session.lastURL?.absoluteString ?? ""
        XCTAssertTrue(url.contains("food/search-fast"))
        XCTAssertTrue(url.contains("query=banana"))
    }

    private func makeAPI(session: URLSessionProtocol) -> APIClient {
        APIClient(
            baseURL: URL(string: "https://eato.test/api/rest/")!,
            session: session,
            interceptor: AuthInterceptor(provider: SilentToken())
        )
    }
}

private actor RecordingSession: URLSessionProtocol {
    private(set) var requestCount = 0
    private(set) var lastURL: URL?
    let response: Data

    init(response: Data) { self.response = response }

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        requestCount += 1
        lastURL = request.url
        return (
            response,
            HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
        )
    }
}

private struct SilentToken: AuthTokenProvider {
    func token() async -> String? { nil }
    func refresh() async throws {}
    func forceSignOut() async {}
}
