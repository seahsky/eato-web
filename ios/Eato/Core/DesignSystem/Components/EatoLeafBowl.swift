import SwiftUI

/// Stylized leaf-in-bowl brand mark.
///
/// SVG path data is taken from the Claude Design `entry.jsx` handoff —
/// see `ios/design-handoff/entry.jsx:33-38`. Reproducing it as SwiftUI
/// `Path`s keeps the mark scalable without bundling a PNG.
///
/// The source viewBox is 64×64; the view scales the path linearly to
/// match the requested `size`.
struct EatoLeafBowl: View {
    /// Foreground color for both the bowl and the leaf.
    var fill: Color
    /// Edge length of the rendered mark in points.
    var size: CGFloat = 64
    /// Show the small white dot on the leaf (only visible against a
    /// terracotta-on-white splash). Defaults to `true` when `fill` is
    /// terracotta-ish — the caller can override.
    var showHighlight: Bool = true

    var body: some View {
        Canvas { ctx, _ in
            let scale = size / 64.0
            ctx.scaleBy(x: scale, y: scale)

            // Bowl: M10 36c0-3 2-5 5-5h34c3 0 5 2 5 5 0 11-9 20-22 20S10 47 10 36z
            var bowl = Path()
            bowl.move(to: CGPoint(x: 10, y: 36))
            bowl.addCurve(
                to: CGPoint(x: 15, y: 31),
                control1: CGPoint(x: 10, y: 33),
                control2: CGPoint(x: 12, y: 31)
            )
            bowl.addLine(to: CGPoint(x: 49, y: 31))
            bowl.addCurve(
                to: CGPoint(x: 54, y: 36),
                control1: CGPoint(x: 52, y: 31),
                control2: CGPoint(x: 54, y: 33)
            )
            bowl.addCurve(
                to: CGPoint(x: 32, y: 56),
                control1: CGPoint(x: 54, y: 47),
                control2: CGPoint(x: 45, y: 56)
            )
            bowl.addCurve(
                to: CGPoint(x: 10, y: 36),
                control1: CGPoint(x: 19, y: 56),
                control2: CGPoint(x: 10, y: 47)
            )
            bowl.closeSubpath()
            ctx.fill(bowl, with: .color(fill))

            // Leaf: M32 8c5 4 8 9 8 14 0 5-3 9-8 9s-8-4-8-9c0-5 3-10 8-14z
            var leaf = Path()
            leaf.move(to: CGPoint(x: 32, y: 8))
            leaf.addCurve(
                to: CGPoint(x: 40, y: 22),
                control1: CGPoint(x: 37, y: 12),
                control2: CGPoint(x: 40, y: 17)
            )
            leaf.addCurve(
                to: CGPoint(x: 32, y: 31),
                control1: CGPoint(x: 40, y: 27),
                control2: CGPoint(x: 37, y: 31)
            )
            leaf.addCurve(
                to: CGPoint(x: 24, y: 22),
                control1: CGPoint(x: 27, y: 31),
                control2: CGPoint(x: 24, y: 27)
            )
            leaf.addCurve(
                to: CGPoint(x: 32, y: 8),
                control1: CGPoint(x: 24, y: 17),
                control2: CGPoint(x: 27, y: 12)
            )
            leaf.closeSubpath()
            ctx.fill(leaf, with: .color(fill))

            if showHighlight {
                let dot = Path(
                    ellipseIn: CGRect(x: 32 - 2.2, y: 22 - 2.2, width: 4.4, height: 4.4)
                )
                ctx.fill(dot, with: .color(.white.opacity(0.6)))
            }
        }
        .frame(width: size, height: size)
    }
}

#Preview {
    HStack(spacing: 24) {
        EatoLeafBowl(fill: EatoColor.terracotta, size: 64)
            .padding(28)
            .background(.white, in: .rect(cornerRadius: 24))

        EatoLeafBowl(fill: .white, size: 44, showHighlight: false)
            .padding(16)
            .background(EatoColor.terracotta, in: .rect(cornerRadius: 22))
    }
    .padding()
    .background(EatoColor.background)
}
