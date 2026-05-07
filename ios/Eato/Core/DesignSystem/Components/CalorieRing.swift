import SwiftUI

struct CalorieRing: View {
    let consumed: Int
    let goal: Int
    var diameter: CGFloat = 120
    var lineWidth: CGFloat = 12

    private var progress: Double {
        guard goal > 0 else { return 0 }
        return min(Double(consumed) / Double(goal), 1.0)
    }

    private var isOver: Bool { consumed > goal }

    private var ringColor: Color {
        isOver ? EatoColor.sage : EatoColor.terracotta
    }

    private var trackColor: Color {
        EatoColor.terracottaSoft.opacity(0.35)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(trackColor, lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    ringColor,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.smooth(duration: 0.5), value: progress)

            VStack(spacing: 2) {
                Text("\(consumed)")
                    .font(.system(size: diameter * 0.22, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .monospacedDigit()
                Text("of \(goal) kcal")
                    .font(.system(size: diameter * 0.1, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
        .frame(width: diameter, height: diameter)
    }
}

#Preview {
    VStack(spacing: 24) {
        CalorieRing(consumed: 1450, goal: 2000)
        CalorieRing(consumed: 2150, goal: 2000, diameter: 80, lineWidth: 8)
    }
    .padding()
    .background(EatoColor.background)
}
