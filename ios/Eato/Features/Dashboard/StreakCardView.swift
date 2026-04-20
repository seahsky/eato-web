import SwiftUI

struct StreakCardView: View {
    let streak: StreakDataDTO

    var body: some View {
        Card {
            HStack(spacing: Spacing.md) {
                ZStack {
                    Circle()
                        .fill(EatoColor.accent.opacity(0.12))
                    Text(flameEmoji)
                        .font(.system(size: 28))
                }
                .frame(width: 52, height: 52)

                VStack(alignment: .leading, spacing: Spacing.xxs) {
                    Text("\(streak.currentStreak)-day streak")
                        .font(Typography.titleSmall)
                    Text(subtitle)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
                Spacer()
                if streak.streakAtRisk {
                    Text("At risk")
                        .font(Typography.caption)
                        .padding(.horizontal, Spacing.sm)
                        .padding(.vertical, Spacing.xxs)
                        .background(EatoColor.warning.opacity(0.2), in: .rect(cornerRadius: Radius.pill))
                        .foregroundStyle(EatoColor.warning)
                }
            }
        }
    }

    private var flameEmoji: String {
        switch streak.flameSize {
        case "blazing": "🔥🔥"
        case "strong": "🔥"
        case "growing": "🟠"
        case "starting": "✨"
        default: "💤"
        }
    }

    private var subtitle: String {
        if streak.nextMilestone > 0 {
            "Next milestone in \(streak.nextMilestone - streak.currentStreak) days"
        } else {
            "Longest: \(streak.longestStreak) days"
        }
    }
}
