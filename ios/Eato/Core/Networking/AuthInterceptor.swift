import Foundation

protocol AuthTokenProvider: Sendable {
    func token() async -> String?
    func refresh() async throws
    func forceSignOut() async
}

// Adds a Bearer token to every request. On 401 we refresh once then retry;
// a second 401 triggers forceSignOut so the UI can fall back to SignInView.
actor AuthInterceptor {
    private let provider: AuthTokenProvider

    init(provider: AuthTokenProvider) {
        self.provider = provider
    }

    func authorize(_ request: inout URLRequest) async {
        if let token = await provider.token() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    func handleUnauthorized(retryCount: Int) async throws -> Bool {
        if retryCount >= 1 {
            await provider.forceSignOut()
            return false
        }
        try await provider.refresh()
        return true
    }
}
