import AuthenticationServices
import SwiftUI

struct SignInWithGoogleButton: View {
    let onTap: () async -> Void

    @State private var isWorking = false

    var body: some View {
        Button {
            isWorking = true
            Task {
                await onTap()
                isWorking = false
            }
        } label: {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "globe")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("Continue with Google")
                    .font(Typography.body)
                    .fontWeight(.semibold)
                    .foregroundStyle(EatoColor.textPrimary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(EatoColor.divider, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        }
        .buttonStyle(.plain)
        .allowsHitTesting(!isWorking)
        .opacity(isWorking ? 0.6 : 1)
    }
}

enum SignInWithGoogleError {
    static func isCancellation(_ error: Error) -> Bool {
        if case ASWebAuthenticationSessionError.canceledLogin = error { return true }
        if let asError = error as? ASWebAuthenticationSessionError, asError.code == .canceledLogin {
            return true
        }
        return false
    }
}
