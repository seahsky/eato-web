import SwiftUI

/// Plain message payload for the bottom-anchored confirmation toast
/// shown after a save. Mirrors `add.jsx:136-152`.
struct ToastMessage: Equatable {
    let text: String
    /// SF Symbol name shown in the leading round chip.
    let icon: String

    static let saved = ToastMessage(text: "Saved to today", icon: "checkmark")
}

/// Terracotta pill that fades up from the bottom edge after a successful
/// save. Caller is responsible for binding presentation + auto-dismissal
/// (typically 1.1s, per design).
struct Toast: View {
    let message: ToastMessage

    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(.white.opacity(0.25))
                    .frame(width: 22, height: 22)
                Image(systemName: message.icon)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(.white)
            }
            Text(message.text)
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(.white)
                .lineLimit(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(EatoColor.terracotta, in: .rect(cornerRadius: 16))
        .shadow(color: .black.opacity(0.2), radius: 30, x: 0, y: 10)
    }
}

#Preview {
    VStack {
        Spacer()
        Toast(message: .saved)
            .padding(.horizontal, 20)
            .padding(.bottom, 48)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(EatoColor.background)
}
