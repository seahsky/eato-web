import Foundation
import Clerk

// Thin adapter around Clerk's iOS SDK so the rest of the app speaks
// AuthTokenProvider rather than reaching into Clerk directly. Keeps testability
// and means we can swap providers without touching call-sites.
actor ClerkSession: AuthTokenProvider {
    static let shared = ClerkSession()

    private var lastSignOutHandler: (@Sendable () async -> Void)?

    func setSignOutHandler(_ handler: @escaping @Sendable () async -> Void) {
        lastSignOutHandler = handler
    }

    func token() async -> String? {
        do {
            return try await Clerk.shared.session?.getToken()?.jwt
        } catch {
            return nil
        }
    }

    func refresh() async throws {
        _ = try await Clerk.shared.session?.getToken(.init(skipCache: true))
    }

    func forceSignOut() async {
        try? await Clerk.shared.signOut()
        if let handler = lastSignOutHandler {
            await handler()
        }
    }

    func signInWithApple(identityToken: String) async throws {
        _ = try await SignIn.create(
            strategy: .idToken(provider: .apple, idToken: identityToken)
        )
    }

    func signInWithGoogle() async throws {
        let signIn = try await SignIn.create(strategy: .oauth(provider: .google))
        _ = try await signIn.authenticateWithRedirect()
    }
}
