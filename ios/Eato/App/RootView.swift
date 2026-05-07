import SwiftUI

struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        switch session.state {
        case .loading:
            SplashView()
        case .signedOut:
            SignInView()
        case .signedIn:
            if session.profileCompleted {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
    }
}
