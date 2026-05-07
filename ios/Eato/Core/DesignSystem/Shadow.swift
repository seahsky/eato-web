import SwiftUI

private struct SoftShadow: ViewModifier {
    let elevation: CGFloat
    func body(content: Content) -> some View {
        content
            .shadow(
                color: EatoColor.darkBrown.opacity(0.06),
                radius: elevation * 1.5,
                x: 0,
                y: elevation * 0.5
            )
            .shadow(
                color: EatoColor.darkBrown.opacity(0.04),
                radius: elevation * 0.5,
                x: 0,
                y: elevation * 0.25
            )
    }
}

extension View {
    func softShadow(elevation: CGFloat = 8) -> some View {
        modifier(SoftShadow(elevation: elevation))
    }
}
