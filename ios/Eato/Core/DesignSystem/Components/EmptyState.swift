import SwiftUI

struct EmptyState: View {
    let systemImage: String
    let title: String
    let message: String
    var action: (title: String, handler: () -> Void)? = nil

    var body: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: systemImage)
                .font(.system(size: 44, weight: .light))
                .foregroundStyle(EatoColor.textSecondary)
            Text(title).font(Typography.titleMedium)
            Text(message)
                .font(Typography.bodyMedium)
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)
            if let action {
                PrimaryButton(action.title, action: action.handler)
                    .padding(.top, Spacing.sm)
            }
        }
        .padding(Spacing.xl)
    }
}
