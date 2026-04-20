import Foundation
import Observation
import Clerk

enum AuthState: Equatable {
    case loading
    case signedOut
    case signedIn
}

@Observable
@MainActor
final class SessionStore {
    private(set) var state: AuthState = .loading
    private(set) var currentUser: UserDTO?
    private(set) var lastError: APIError?

    private let api: APIClient

    init(
        api: APIClient = APIClient(interceptor: AuthInterceptor(provider: ClerkSession.shared))
    ) {
        self.api = api
    }

    func bootstrap() async {
        await ClerkSession.shared.setSignOutHandler { [weak self] in
            await self?.applySignedOut()
        }
        if Clerk.shared.session == nil {
            state = .signedOut
            return
        }
        await loadMe()
    }

    func loadMe() async {
        do {
            let user = try await api.send(AuthAPI.me)
            currentUser = user
            state = .signedIn
            lastError = nil
        } catch let apiError as APIError {
            lastError = apiError
            if case .unauthorized = apiError {
                state = .signedOut
            } else {
                // Treat transient failures as still-signed-in; caller retries.
                state = Clerk.shared.session == nil ? .signedOut : .signedIn
            }
        } catch {
            lastError = .server(message: error.localizedDescription)
        }
    }

    func signOut() async {
        try? await Clerk.shared.signOut()
        await applySignedOut()
    }

    fileprivate func applySignedOut() {
        currentUser = nil
        state = .signedOut
    }
}
