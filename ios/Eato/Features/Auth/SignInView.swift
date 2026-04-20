import SwiftUI

struct SignInView: View {
    @Environment(SessionStore.self) private var session
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Spacer()
            VStack(spacing: Spacing.md) {
                Text("Eato")
                    .font(Typography.displayLarge)
                Text("Track calories together.")
                    .font(Typography.body)
                    .foregroundStyle(EatoColor.textSecondary)
            }
            Spacer()
            VStack(spacing: Spacing.md) {
                SignInWithAppleButton(
                    onToken: { token in
                        do {
                            try await ClerkSession.shared.signInWithApple(identityToken: token)
                            await session.loadMe()
                        } catch {
                            errorMessage = error.localizedDescription
                        }
                    },
                    onError: { error in
                        if let siwa = error as? SignInWithAppleError, siwa == .cancelled {
                            errorMessage = nil
                        } else {
                            errorMessage = error.localizedDescription
                        }
                    }
                )
                if let errorMessage {
                    Text(errorMessage)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.danger)
                        .multilineTextAlignment(.center)
                }
                Text("By continuing you agree to our Terms and Privacy Policy.")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(EatoColor.background)
    }
}
