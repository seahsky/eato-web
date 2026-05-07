import SwiftUI

struct SectionHeader<Trailing: View>: View {
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                }
            }
            Spacer(minLength: Spacing.sm)
            trailing()
        }
    }
}

extension SectionHeader where Trailing == EmptyView {
    init(_ title: String, subtitle: String? = nil) {
        self.init(title: title, subtitle: subtitle, trailing: { EmptyView() })
    }
}

#Preview {
    VStack(spacing: 16) {
        SectionHeader("Today", subtitle: "Wed, May 7")
        SectionHeader(title: "Recents", trailing: {
            Pill(text: "View all", icon: "chevron.right")
        })
    }
    .padding()
    .background(EatoColor.background)
}
