import SwiftUI

struct SummaryStrip: View {
    let consumed: Int
    let goal: Int
    let weeklyTotal: Int?
    let weeklyGoal: Int?

    private var remaining: Int { max(0, goal - consumed) }

    var body: some View {
        HStack(spacing: Spacing.lg) {
            CalorieRing(consumed: consumed, goal: goal, diameter: 76, lineWidth: 8)

            VStack(alignment: .leading, spacing: 6) {
                stat(
                    label: "Left today",
                    value: "\(remaining)",
                    suffix: "kcal",
                    tint: EatoColor.terracotta
                )

                if let weeklyTotal {
                    stat(
                        label: "This week",
                        value: weeklyValueText(weeklyTotal),
                        suffix: weeklyGoal.map { "/ \(Int($0 / 1000))k" } ?? "kcal",
                        tint: EatoColor.sage
                    )
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 6)
    }

    private func weeklyValueText(_ total: Int) -> String {
        if total >= 1000 {
            return String(format: "%.1fk", Double(total) / 1000.0)
        }
        return "\(total)"
    }

    private func stat(label: String, value: String, suffix: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(0.8)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(tint)
                    .monospacedDigit()
                Text(suffix)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
    }
}
