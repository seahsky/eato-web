import AuthenticationServices
import SwiftUI

struct SignInWithAppleButton: View {
    let onToken: (String) async -> Void
    let onError: (Error) -> Void

    @State private var isWorking = false

    var body: some View {
        _SignInWithAppleButtonRepresentable(
            onCredential: { credential in
                guard
                    let tokenData = credential.identityToken,
                    let token = String(data: tokenData, encoding: .utf8)
                else {
                    onError(SignInWithAppleError.missingToken)
                    return
                }
                isWorking = true
                Task {
                    await onToken(token)
                    isWorking = false
                }
            },
            onError: onError
        )
        .frame(height: 50)
        .allowsHitTesting(!isWorking)
        .opacity(isWorking ? 0.6 : 1)
    }
}

enum SignInWithAppleError: Error, LocalizedError {
    case missingToken
    case cancelled
    case unavailable
    case failed

    var errorDescription: String? {
        switch self {
        case .missingToken: "Apple did not return a sign-in token."
        case .cancelled: "Sign-in cancelled."
        case .unavailable:
            "Sign in with Apple isn't available right now. Make sure you're signed into iCloud in Settings, then try again."
        case .failed: "Sign in with Apple failed. Please try again."
        }
    }
}

private struct _SignInWithAppleButtonRepresentable: UIViewRepresentable {
    let onCredential: (ASAuthorizationAppleIDCredential) -> Void
    let onError: (Error) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onCredential: onCredential, onError: onError)
    }

    func makeUIView(context: Context) -> ASAuthorizationAppleIDButton {
        let button = ASAuthorizationAppleIDButton(type: .signIn, style: .black)
        button.cornerRadius = Radius.md
        button.addTarget(
            context.coordinator,
            action: #selector(Coordinator.tap),
            for: .touchUpInside
        )
        return button
    }

    func updateUIView(_ uiView: ASAuthorizationAppleIDButton, context: Context) {}

    final class Coordinator: NSObject, ASAuthorizationControllerDelegate,
        ASAuthorizationControllerPresentationContextProviding
    {
        private let onCredential: (ASAuthorizationAppleIDCredential) -> Void
        private let onError: (Error) -> Void

        init(
            onCredential: @escaping (ASAuthorizationAppleIDCredential) -> Void,
            onError: @escaping (Error) -> Void
        ) {
            self.onCredential = onCredential
            self.onError = onError
        }

        @objc func tap() {
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }

        func authorizationController(
            controller: ASAuthorizationController,
            didCompleteWithAuthorization authorization: ASAuthorization
        ) {
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential
            else {
                onError(SignInWithAppleError.missingToken)
                return
            }
            onCredential(credential)
        }

        func authorizationController(
            controller: ASAuthorizationController,
            didCompleteWithError error: Error
        ) {
            guard let authError = error as? ASAuthorizationError else {
                onError(error)
                return
            }
            switch authError.code {
            case .canceled:
                onError(SignInWithAppleError.cancelled)
            case .unknown, .notInteractive, .notHandled:
                onError(SignInWithAppleError.unavailable)
            case .failed, .invalidResponse:
                onError(SignInWithAppleError.failed)
            @unknown default:
                onError(SignInWithAppleError.failed)
            }
        }

        func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
            UIApplication.shared.connectedScenes
                .compactMap { ($0 as? UIWindowScene)?.keyWindow }
                .first ?? ASPresentationAnchor()
        }
    }
}
