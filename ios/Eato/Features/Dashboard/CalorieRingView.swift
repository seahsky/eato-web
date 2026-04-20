import SwiftUI

struct CalorieRingView: View {
    let consumed: Double
    let goal: Double

    private var progress: Double {
        goal > 0 ? min(1, consumed / goal) : 0
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(EatoColor.divider, lineWidth: 14)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    progress >= 1 ? EatoColor.success : EatoColor.accent,
                    style: StrokeStyle(lineWidth: 14, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.6), value: progress)
            VStack(spacing: Spacing.xxs) {
                Text("\(Int(consumed))")
                    .font(Typography.displayLarge)
                    .monospacedDigit()
                Text("of \(Int(goal)) kcal")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
        .frame(width: 220, height: 220)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Consumed \(Int(consumed)) of \(Int(goal)) calories")
    }
}
