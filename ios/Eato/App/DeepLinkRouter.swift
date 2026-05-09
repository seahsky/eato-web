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
    /// Set when a circle / moment push is tapped. The Friends tab's Circles
    /// sub-tab consumes this to push the right detail screen.
    var pendingCircleId: String?
    var pendingCircleMomentId: String?

    func handle(_ url: URL) {
        guard let link = DeepLink.parse(url) else { return }
        pendingLink = link
        switch link {
        case .friendCode(let code):
            pendingFriendCode = code
        case .circle(let id):
            pendingCircleId = id
        case .circleMoment(let circleId, let momentId):
            pendingCircleId = circleId
            pendingCircleMomentId = momentId
        case .friends:
            break
        }
    }

    func consumeFriendCode() -> String? {
        let code = pendingFriendCode
        pendingFriendCode = nil
        return code
    }

    func consumeCircle() -> (circleId: String, momentId: String?)? {
        guard let id = pendingCircleId else { return nil }
        let mom = pendingCircleMomentId
        pendingCircleId = nil
        pendingCircleMomentId = nil
        return (id, mom)
    }

    func consume() -> DeepLink? {
        let link = pendingLink
        pendingLink = nil
        return link
    }
}
