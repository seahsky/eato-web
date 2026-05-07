import SwiftUI

struct StreaksView: View {
    @Environment(SessionStore.self) private var session
    @State private var streak: StreakDataDTO?
    @State private var achievements: AchievementsSummaryDTO?
    @State private var loading: Bool = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if loading && streak == nil {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, Spacing.xxl)
                } else {
                    if let streak {
                        flameCard(streak)
                        statRow(streak)
                        milestoneCard(streak)
                    }
                    if let achievements {
                        badgeGrid(achievements)
                    }
                }
                Spacer(minLength: Spacing.xxl)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.sm)
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        async let s: StreakDataDTO? = try? session.api.send(StatsAPI.streak)
        async let a: AchievementsSummaryDTO? = try? session.api.send(AchievementsAPI.getAll)
        streak = await s
        achievements = await a
    }

    private func flameCard(_ s: StreakDataDTO) -> some View {
        Card {
            VStack(spacing: Spacing.md) {
                Text(flameEmoji(for: s.flameSize))
                    .font(.system(size: 56))

                VStack(spacing: 4) {
                    Text("\(s.currentStreak)")
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.terracotta)
                        .monospacedDigit()
                    Text("day streak")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                }

                if s.streakAtRisk {
                    Pill(
                        text: "At risk",
                        icon: "exclamationmark.triangle.fill",
                        tint: EatoColor.warning,
                        background: EatoColor.warning.opacity(0.16)
                    )
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.md)
        }
    }

    private func statRow(_ s: StreakDataDTO) -> some View {
        HStack(spacing: Spacing.sm) {
            statTile(label: "Longest", value: "\(s.longestStreak)", suffix: "days")
            statTile(label: "Goal streak", value: "\(s.goalStreak)", suffix: "days")
            statTile(label: "Freezes", value: "\(s.streakFreezes)", suffix: "left")
        }
    }

    private func statTile(label: String, value: String, suffix: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.0)
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .monospacedDigit()
                Text(suffix)
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.sm)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
        .softShadow(elevation: 3)
    }

    private func milestoneCard(_ s: StreakDataDTO) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                HStack {
                    Text("Next milestone")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Spacer()
                    Text("\(s.nextMilestone) days")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.terracotta)
                        .monospacedDigit()
                }
                ProgressView(value: Double(s.milestoneProgress), total: 100)
                    .tint(EatoColor.terracotta)
                Text("\(s.milestoneProgress)% there")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
    }

    private func badgeGrid(_ a: AchievementsSummaryDTO) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(
                title: "Achievements",
                subtitle: "\(a.unlockedCount) of \(a.totalBadges) unlocked",
                trailing: { EmptyView() }
            )

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible()),
            ], spacing: Spacing.sm) {
                ForEach(a.allBadges) { badge in
                    badgeTile(badge)
                }
            }
        }
    }

    private func badgeTile(_ badge: BadgeDTO) -> some View {
        VStack(spacing: 4) {
            Text(badge.emoji ?? "🏅")
                .font(.system(size: 28))
                .opacity(badge.unlocked ? 1 : 0.25)
            Text(badge.name)
                .font(.system(size: 9, weight: .semibold, design: .rounded))
                .foregroundStyle(badge.unlocked ? EatoColor.textPrimary : EatoColor.textTertiary)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 80)
        .padding(Spacing.xs)
        .background(
            badge.unlocked ? EatoColor.surface : EatoColor.surface.opacity(0.6),
            in: .rect(cornerRadius: Radius.md)
        )
        .softShadow(elevation: badge.unlocked ? 3 : 1)
    }

    private func flameEmoji(for size: String) -> String {
        switch size.lowercased() {
        case "blazing", "epic": return "🔥🔥"
        case "strong", "large": return "🔥"
        case "growing", "medium": return "🟠"
        case "starting", "small": return "✨"
        default: return "💤"
        }
    }
}
