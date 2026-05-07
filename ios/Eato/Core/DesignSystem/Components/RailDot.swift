import SwiftUI

struct RailDot: View {
    var color: Color = EatoColor.terracotta
    var size: CGFloat = 10
    var ringed: Bool = true

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .overlay(
                Circle()
                    .stroke(EatoColor.background, lineWidth: ringed ? 3 : 0)
            )
    }
}

struct DottedRail: View {
    var color: Color = EatoColor.divider
    var dashLength: CGFloat = 2
    var gap: CGFloat = 4

    var body: some View {
        GeometryReader { geo in
            Path { path in
                path.move(to: CGPoint(x: geo.size.width / 2, y: 0))
                path.addLine(to: CGPoint(x: geo.size.width / 2, y: geo.size.height))
            }
            .stroke(
                color,
                style: StrokeStyle(lineWidth: 1.5, lineCap: .round, dash: [dashLength, gap])
            )
        }
    }
}

#Preview {
    HStack(spacing: 0) {
        ZStack {
            DottedRail()
            VStack(spacing: 40) {
                RailDot()
                RailDot(color: EatoColor.sage)
                RailDot(color: EatoColor.warning, size: 12)
            }
        }
        .frame(width: 24, height: 200)
    }
    .padding()
    .background(EatoColor.background)
}
