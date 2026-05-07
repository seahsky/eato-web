import SwiftUI

struct Card<Content: View>: View {
    private let content: Content
    private let padding: CGFloat
    private let elevation: CGFloat

    init(
        padding: CGFloat = Spacing.lg,
        elevation: CGFloat = 8,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.padding = padding
        self.elevation = elevation
    }

    var body: some View {
        content
            .padding(padding)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
            .softShadow(elevation: elevation)
    }
}

#Preview {
    VStack(spacing: 16) {
        Card {
            Text("Default card")
                .font(Typography.titleSmall)
        }
        Card(padding: Spacing.md, elevation: 4) {
            HStack {
                Avatar(initials: "KS", size: .sm)
                Text("Compact card")
                    .font(Typography.bodyMedium)
            }
        }
    }
    .padding()
    .background(EatoColor.background)
}
