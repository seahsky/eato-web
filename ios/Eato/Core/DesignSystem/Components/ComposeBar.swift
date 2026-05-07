import SwiftUI

struct ComposeBar: View {
    var placeholder: String = "What did you eat?"
    var icon: String = "plus"
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                ZStack {
                    Circle()
                        .fill(EatoColor.terracotta)
                        .frame(width: 36, height: 36)
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                }
                Text(placeholder)
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                Spacer()
                Image(systemName: "camera.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        }
        .buttonStyle(.plain)
        .softShadow(elevation: 6)
    }
}

#Preview {
    ComposeBar { }
        .padding()
        .background(EatoColor.background)
}
