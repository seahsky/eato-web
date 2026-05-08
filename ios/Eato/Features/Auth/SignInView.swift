import SwiftUI

/// Sign-in screen — terracotta brand mark, two-line headline,
/// short tagline, then Apple + Google OAuth buttons. Mirrors
/// `entry.jsx` `LoginScreen`.
struct SignInView: View {
    @Environment(SessionStore.self) private var session
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer()

                // Brand mark — 76pt terracotta tile w/ white leaf-bowl.
                ZStack {
                    RoundedRectangle(cornerRadius: 22)
                        .fill(EatoColor.terracotta)
                        .frame(width: 76, height: 76)
                        .shadow(
                            color: EatoColor.terracotta.opacity(0.45),
                            radius: 20, x: 0, y: 12
                        )
                    EatoLeafBowl(fill: .white, size: 44, showHighlight: false)
                }
                .padding(.bottom, 28)

                // Headline — "Welcome to" / "eato." stacked.
                VStack(alignment: .leading, spacing: 0) {
                    Text("Welcome to")
                        .foregroundStyle(EatoColor.textPrimary)
                    Text("eato.")
                        .foregroundStyle(EatoColor.terracotta)
                }
                .font(.system(size: 40, weight: .heavy, design: .rounded))
                .kerning(-0.5)
                .lineSpacing(-6)

                // Sub-tagline.
                Text("A kinder food diary. Take a photo, write a line, move on with your day.")
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                    .lineSpacing(2)
                    .frame(maxWidth: 300, alignment: .leading)
                    .padding(.top, 16)

                Spacer()

                VStack(spacing: 12) {
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
                    .frame(height: 54)
                    .clipShape(.rect(cornerRadius: 14))

                    SignInWithGoogleButton {
                        do {
                            try await ClerkSession.shared.signInWithGoogle()
                            await session.loadMe()
                        } catch {
                            if SignInWithGoogleError.isCancellation(error) {
                                errorMessage = nil
                            } else {
                                errorMessage = error.localizedDescription
                            }
                        }
                    }
                    .frame(height: 54)
                    .clipShape(.rect(cornerRadius: 14))

                    if let errorMessage {
                        Text(errorMessage)
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.danger)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                    }

                    Text("By continuing you agree to our Terms and Privacy Policy.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .lineSpacing(2)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 10)
                }
            }
            .padding(.horizontal, 28)
            .padding(.top, 72)
            .padding(.bottom, 36)
        }
    }
}
