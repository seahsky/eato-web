import SwiftUI

struct StreaksView: View {
    @Environment(SessionStore.self) private var session
    @State private var streak: StreakDataDTO?
    @State private var achievements: AchievementsSummaryDTO?
    @State private var loading: Bool = true
    @State private var category: BadgeCategory = .all

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                pageHeader
                    .padding(.horizontal, 24)
                    .padding(.top, 8)

                if loading && streak == nil {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else {
                    if let streak {
                        heroCard(streak)
                            .padding(.horizontal, 20)
                        milestoneCard(streak)
                            .padding(.horizontal, 20)
                    }
                    if let achievements {
                        badgesHeader(achievements)
                            .padding(.horizontal, 24)
                        categoryChips
                        badgeGrid(achievements)
                            .padding(.horizontal, 20)
                    }
                }
                Spacer(minLength: 40)
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Header

    private var pageHeader: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("YOU'RE ON FIRE")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.4)
            Text("Streaks")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Hero card with flicker flame

    private func heroCard(_ s: StreakDataDTO) -> some View {
        let tier = tierFor(streak: s.currentStreak)
        let circleSize: CGFloat = 72 + Double(tier) * 8
        let flameSize: CGFloat = 44 + Double(tier) * 6
        return ZStack(alignment: .leading) {
            LinearGradient(
                colors: [EatoColor.terracotta, EatoColor.terracottaDeep],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .clipShape(.rect(cornerRadius: 26))

            // Faint big-flame motif
            Image(systemName: "flame.fill")
                .font(.system(size: 180, weight: .heavy))
                .foregroundStyle(.white.opacity(0.12))
                .offset(x: 130, y: 60)

            HStack(spacing: 18) {
                FlameFlicker(circleSize: circleSize, flameSize: flameSize)
                VStack(alignment: .leading, spacing: 6) {
                    Text("CURRENT STREAK")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.85))
                        .kerning(1.0)
                    Text("\(s.currentStreak) day\(s.currentStreak == 1 ? "" : "s")")
                        .font(.system(size: 40, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                    Text(nextMilestoneCopy(s))
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.95))
                }
                Spacer()
            }
            .padding(22)
        }
        .frame(minHeight: 150)
        .shadow(color: EatoColor.terracotta.opacity(0.28), radius: 18, x: 0, y: 14)
    }

    private func tierFor(streak: Int) -> Int {
        if streak >= 365 { return 4 }
        if streak >= 90 { return 3 }
        if streak >= 30 { return 2 }
        if streak >= 7 { return 1 }
        return 0
    }

    private func nextMilestoneCopy(_ s: StreakDataDTO) -> String {
        let next = s.nextMilestone
        let remaining = max(0, next - s.currentStreak)
        if remaining == 0 { return "you've hit the milestone." }
        return "\(remaining) more until your \(next)-day badge"
    }

    // MARK: - Milestone bar

    private func milestoneCard(_ s: StreakDataDTO) -> some View {
        Card {
            VStack(alignment: .leading, spacing: 14) {
                Text("Milestones")
                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)

                MilestoneBar(currentStreak: s.currentStreak)

                HStack {
                    ForEach(["week", "month", "season", "year"], id: \.self) { label in
                        Text(label)
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(EatoColor.textTertiary)
                            .kerning(0.5)
                            .frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }

    // MARK: - Badges header + chips

    private func badgesHeader(_ a: AchievementsSummaryDTO) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text("Badges")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Spacer()
            Text("\(a.unlockedCount) of \(a.totalBadges) earned")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
        }
    }

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(BadgeCategory.allCases, id: \.self) { c in
                    Button { category = c } label: {
                        Text(c.label)
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundStyle(category == c ? .white : EatoColor.textSecondary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                category == c ? EatoColor.terracotta : EatoColor.surface,
                                in: Capsule()
                            )
                            .softShadow(elevation: category == c ? 0 : 2)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Badge grid

    private func badgeGrid(_ a: AchievementsSummaryDTO) -> some View {
        let filtered = a.allBadges.filter { badge in
            switch category {
            case .all: return true
            default:
                return (badge.category ?? "").lowercased() == category.rawValue
            }
        }
        return LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3),
            spacing: 10
        ) {
            ForEach(filtered) { badge in
                BadgeTile(badge: badge)
            }
        }
    }

    // MARK: - Loading

    private func load() async {
        loading = true
        defer { loading = false }
        async let s: StreakDataDTO? = try? session.api.send(StatsAPI.streak)
        async let a: AchievementsSummaryDTO? = try? session.api.send(AchievementsAPI.getAll)
        streak = await s
        achievements = await a
    }
}

// MARK: - Flame flicker

/// Implements the JSX `flameFlicker 2.2s ease-in-out infinite` animation —
/// scale 1.0 ↔ 1.08 driven by `TimelineView(.animation)` so the
/// inner circle gently breathes regardless of which view is on screen.
private struct FlameFlicker: View {
    let circleSize: CGFloat
    let flameSize: CGFloat

    var body: some View {
        TimelineView(.animation) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            // 2.2s period, smooth in/out
            let phase = (sin(t * .pi / 1.1) + 1) / 2  // 0..1
            let scale = 1.0 + 0.08 * phase
            ZStack {
                Circle()
                    .fill(.white.opacity(0.18))
                    .frame(width: circleSize, height: circleSize)
                Image(systemName: "flame.fill")
                    .font(.system(size: flameSize, weight: .heavy))
                    .foregroundStyle(Color(red: 1.0, green: 0xE2 / 255, blue: 0xB0 / 255))
            }
            .scaleEffect(scale)
        }
    }
}

// MARK: - Milestone bar

private struct MilestoneBar: View {
    let currentStreak: Int
    private let milestones: [Int] = [7, 30, 90, 365]

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Track
                Capsule()
                    .fill(EatoColor.divider)
                    .frame(height: 4)
                    .padding(.horizontal, 12)
                // Progress
                Capsule()
                    .fill(EatoColor.terracotta)
                    .frame(
                        width: max(
                            0,
                            min(
                                geo.size.width - 24,
                                (geo.size.width - 24) * progress
                            )
                        ),
                        height: 4
                    )
                    .padding(.leading, 12)

                // Checkpoints
                HStack(spacing: 0) {
                    ForEach(milestones, id: \.self) { m in
                        checkpoint(m: m)
                            .frame(width: pointWidth(at: m, total: geo.size.width), alignment: .leading)
                    }
                }
                .padding(.horizontal, 0)
            }
        }
        .frame(height: 28)
    }

    private var progress: Double {
        guard let last = milestones.last else { return 0 }
        return min(1, Double(currentStreak) / Double(last))
    }

    private func pointWidth(at milestone: Int, total: CGFloat) -> CGFloat {
        // Place each checkpoint at its proportional position.
        guard let last = milestones.last else { return 0 }
        guard let idx = milestones.firstIndex(of: milestone) else { return 0 }
        let prev = idx == 0 ? 0 : milestones[idx - 1]
        let span = milestone - prev
        return CGFloat(span) / CGFloat(last) * (total - 24)
    }

    @ViewBuilder
    private func checkpoint(m: Int) -> some View {
        let reached = currentStreak >= m
        ZStack {
            Circle()
                .fill(reached ? EatoColor.terracotta : EatoColor.surfaceWarm)
                .frame(width: 24, height: 24)
                .overlay(
                    Circle()
                        .strokeBorder(
                            reached ? EatoColor.terracotta : EatoColor.divider,
                            lineWidth: 2
                        )
                )
            if reached {
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(.white)
            } else {
                Text("\(m)")
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }
}

// MARK: - Badge tile

private struct BadgeTile: View {
    let badge: BadgeDTO

    var body: some View {
        let rarity = badge.rarityTier
        let earned = badge.unlocked
        VStack(spacing: 6) {
            Circle()
                .fill(earned ? rarity.tint.opacity(0.18) : EatoColor.surfaceWarm)
                .frame(width: 52, height: 52)
                .overlay(
                    Image(systemName: iconName(for: badge.icon ?? "star"))
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(earned ? rarity.tint : EatoColor.textTertiary)
                )
                .saturation(earned ? 1 : 0)
            Text(badge.name)
                .font(.system(size: 12, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
            Text(badge.description)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(minHeight: 24)
            Text(rarity.label.uppercased())
                .font(.system(size: 9, weight: .heavy, design: .rounded))
                .foregroundStyle(rarity.tint)
                .kerning(1.0)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity)
        .background(EatoColor.surface, in: .rect(cornerRadius: 18))
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .strokeBorder(
                    earned ? rarity.tint.opacity(0.3) : .clear,
                    lineWidth: 1.5
                )
        )
        .shadow(
            color: earned ? rarity.tint.opacity(rarity.glowOpacity) : .clear,
            radius: 14, x: 0, y: 4
        )
        .softShadow(elevation: earned ? 0 : 2)
        .opacity(earned ? 1 : 0.5)
    }

    /// Map the backend's icon-name string to an SF Symbol the iOS client can
    /// render. Falls back to "star.fill" for unknown values.
    private func iconName(for raw: String) -> String {
        switch raw.lowercased() {
        case "flame", "fire": return "flame.fill"
        case "calendar": return "calendar"
        case "star": return "star.fill"
        case "trophy": return "trophy.fill"
        case "utensils": return "fork.knife"
        case "target": return "target"
        case "users", "people", "heart": return "person.2.fill"
        case "book", "notes": return "book.fill"
        case "rocket": return "airplane"
        case "lightning", "bolt": return "bolt.fill"
        case "leaf": return "leaf.fill"
        case "moon": return "moon.fill"
        case "sun": return "sun.max.fill"
        default: return "star.fill"
        }
    }
}

// MARK: - Categories

enum BadgeCategory: String, CaseIterable {
    case all
    case consistency
    case logging
    case goals
    case social

    var label: String {
        switch self {
        case .all: "All"
        case .consistency: "Consistency"
        case .logging: "Logging"
        case .goals: "Goals"
        case .social: "Social"
        }
    }
}
