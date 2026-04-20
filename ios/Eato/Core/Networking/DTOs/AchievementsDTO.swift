import Foundation

struct BadgeDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let name: String
    let description: String
    let emoji: String?
    let category: String?
    let unlocked: Bool
    let unlockedAt: Date?
}

struct AchievementsSummaryDTO: Decodable, Sendable, Equatable {
    let unlockedBadges: [BadgeDTO]
    let allBadges: [BadgeDTO]
    let totalBadges: Int
    let unlockedCount: Int
    let currentTheme: String
    let currentAvatarFrame: String
}
