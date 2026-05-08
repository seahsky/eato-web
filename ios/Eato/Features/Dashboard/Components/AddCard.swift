import SwiftUI

/// Leading tile of the today grid — dashed primary border, slight tilt,
/// big plus icon. Mirrors `dashboard.jsx` `AddCard`.
struct AddCard: View {
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            ZStack {
                LinearGradient(
                    colors: [
                        EatoColor.terracotta.opacity(0.14),
                        EatoColor.terracotta.opacity(0.06),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .clipShape(.rect(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .strokeBorder(
                            EatoColor.terracotta.opacity(0.4),
                            style: StrokeStyle(lineWidth: 1.5, dash: [5, 4])
                        )
                )

                Circle()
                    .fill(EatoColor.terracotta)
                    .frame(width: 52, height: 52)
                    .shadow(
                        color: EatoColor.terracotta.opacity(0.4),
                        radius: 14, x: 0, y: 6
                    )
                    .overlay(
                        Image(systemName: "plus")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                    )
            }
            .frame(height: 170)
            .frame(maxWidth: .infinity)
            .rotationEffect(.degrees(-0.4))
        }
        .buttonStyle(.plain)
    }
}
