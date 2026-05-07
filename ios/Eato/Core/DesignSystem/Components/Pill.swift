import SwiftUI

struct Pill: View {
    let text: String
    var icon: String? = nil
    var tint: Color = EatoColor.terracotta
    var background: Color = EatoColor.terracottaSoft.opacity(0.35)

    var body: some View {
        HStack(spacing: 4) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .semibold))
            }
            Text(text)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(background, in: Capsule())
    }
}

#Preview {
    VStack(spacing: 12) {
        Pill(text: "Breakfast", icon: "sun.max.fill")
        Pill(text: "Goal", tint: EatoColor.sage, background: EatoColor.sageSoft.opacity(0.4))
        Pill(text: "Logged", icon: "checkmark.circle.fill", tint: EatoColor.darkBrown, background: EatoColor.surfaceWarm)
    }
    .padding()
    .background(EatoColor.background)
}
