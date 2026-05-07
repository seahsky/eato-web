import SwiftUI
import Observation

// Tiny @Observable shared by MainTabView and its children so a deep-link
// hitting from outside the app (URL, APN action) can push the right tab
// and surface an inline affordance (e.g. pre-fill friend code).
@Observable
@MainActor
final class DeepLinkRouter {
    var pendingLink: DeepLink?
    var pendingFriendCode: String?

    func handle(_ url: URL) {
        guard let link = DeepLink.parse(url) else { return }
        pendingLink = link
        if case .friendCode(let code) = link {
            pendingFriendCode = code
        }
    }

    func consumeFriendCode() -> String? {
        let code = pendingFriendCode
        pendingFriendCode = nil
        return code
    }

    func consume() -> DeepLink? {
        let link = pendingLink
        pendingLink = nil
        return link
    }
}
