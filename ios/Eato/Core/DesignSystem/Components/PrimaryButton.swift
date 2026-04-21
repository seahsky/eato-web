import SwiftUI

struct PrimaryButton: View {
    private let title: String
    private let icon: Image?
    private let isLoading: Bool
    private let action: () -> Void

    init(_ title: String, icon: Image? = nil, isLoading: Bool = false, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.isLoading = isLoading
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.sm) {
                if isLoading {
                    ProgressView().tint(EatoColor.accentContrast)
                } else if let icon {
                    icon
                }
                Text(title).font(Typography.titleSmall)
            }
            .frame(maxWidth: .infinity, minHeight: 50)
            .foregroundStyle(EatoColor.accentContrast)
            .background(EatoColor.accent, in: .rect(cornerRadius: Radius.md))
        }
        .disabled(isLoading)
        .sensoryFeedback(.impact(weight: .light), trigger: isLoading)
    }
}
