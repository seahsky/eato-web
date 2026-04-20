import SwiftUI

struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        switch session.state {
        case .loading:
            ProgressView().progressViewStyle(.circular)
        case .signedOut:
            SignInView()
        case .signedIn:
            SignedInPlaceholderView()
        }
    }
}

// Placeholder until Phase 1 lands the tab layout + onboarding wizard.
struct SignedInPlaceholderView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Text("Signed in")
                .font(Typography.titleLarge)
            if let user = session.currentUser {
                Text(user.email)
                    .font(Typography.body)
                    .foregroundStyle(EatoColor.textSecondary)
            }
            PrimaryButton("Sign out") {
                Task { await session.signOut() }
            }
        }
        .padding(Spacing.lg)
    }
}
