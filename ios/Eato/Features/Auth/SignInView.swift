import SwiftUI

struct SignInView: View {
    @Environment(SessionStore.self) private var session
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: Spacing.lg) {
                    // Brand mark — terracotta circle with "e."
                    ZStack {
                        Circle()
                            .fill(EatoColor.terracotta)
                            .frame(width: 88, height: 88)
                            .softShadow(elevation: 12)
                        Text("e.")
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .kerning(-2)
                    }

                    VStack(spacing: Spacing.xs) {
                        Text("Welcome to eato.")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(EatoColor.textPrimary)
                        Text("A gentle calorie diary you'll actually keep.")
                            .font(.system(size: 16, weight: .medium, design: .rounded))
                            .foregroundStyle(EatoColor.textSecondary)
                            .multilineTextAlignment(.center)
                    }
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

                    if let errorMessage {
                        Text(errorMessage)
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.danger)
                            .multilineTextAlignment(.center)
                    }

                    Text("By continuing you agree to our Terms and Privacy Policy.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .multilineTextAlignment(.center)
                        .padding(.top, Spacing.xs)
                }
                .padding(.horizontal, Spacing.xl)
                .padding(.bottom, Spacing.xxl)
            }
        }
    }
}
