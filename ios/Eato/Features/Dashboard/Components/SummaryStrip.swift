import SwiftUI

/// Day-summary card sitting below the photo grid (`dashboard.jsx:175`).
/// 60dp ring + "DAY TOTAL" eyebrow + N/budget + "X kcal left/under/over".
struct SummaryStrip: View {
    let consumed: Int
    let goal: Int
    /// `nil` for today's view, otherwise an absolute date label like `APR 18`
    /// to show on the eyebrow row.
    var dateLabel: String? = nil
    /// `true` when this is the live "today" view; controls the "left" vs.
    /// "under" wording.
    var isToday: Bool = true

    private var remaining: Int { goal - consumed }

    var body: some View {
        HStack(spacing: 14) {
            CalorieRing(consumed: consumed, goal: goal, diameter: 60, lineWidth: 6)
                .layoutPriority(0)

            VStack(alignment: .leading, spacing: 2) {
                Text(eyebrow)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(consumed)")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                        .kerning(-0.3)
                        .monospacedDigit()
                    Text("/ \(goal)")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .monospacedDigit()
                }

                Text(remainingText)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(remainingColor)
                    .padding(.top, 2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
        .background(EatoColor.surface, in: .rect(cornerRadius: 20))
        .softShadow(elevation: 6)
    }

    private var eyebrow: String {
        if let dateLabel { return "\(dateLabel) · TOTAL" }
        return "DAY TOTAL"
    }

    private var remainingText: String {
        if remaining >= 0 {
            return "\(remaining) kcal \(isToday ? "left" : "under")"
        } else {
            return "\(abs(remaining)) kcal over"
        }
    }

    private var remainingColor: Color {
        remaining >= 0 ? EatoColor.textSecondary : EatoColor.danger
    }
}
