import SwiftUI

struct AchievementsShelfView: View {
    let summary: AchievementsSummaryDTO

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Text("Achievements")
                    .font(Typography.titleSmall)
                Spacer()
                Text("\(summary.unlockedCount) / \(summary.totalBadges)")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.md) {
                    ForEach(summary.allBadges.prefix(10)) { badge in
                        BadgePill(badge: badge)
                    }
                }
            }
        }
    }
}

private struct BadgePill: View {
    let badge: BadgeDTO

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Text(badge.emoji ?? "🏅")
                .font(.system(size: 28))
                .opacity(badge.unlocked ? 1 : 0.35)
            Text(badge.name)
                .font(Typography.caption)
                .foregroundStyle(badge.unlocked ? EatoColor.textPrimary : EatoColor.textSecondary)
                .lineLimit(1)
        }
        .frame(width: 80)
        .padding(.vertical, Spacing.sm)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }
}
