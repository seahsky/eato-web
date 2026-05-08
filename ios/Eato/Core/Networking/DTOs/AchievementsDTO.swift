import Foundation

struct BadgeDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let name: String
    let description: String
    /// Backend sends an icon name like `"flame"` / `"utensils"` (mapped to an
    /// SF Symbol on display). Decoded from the wire field `icon` first, with
    /// `emoji` accepted as a legacy fallback.
    let icon: String?
    let category: String?
    /// One of "common" / "uncommon" / "rare" / "epic" / "legendary".
    /// Optional in the DTO so older payloads without this field still decode.
    let rarity: String?
    let requirement: String?
    let unlocked: Bool
    let unlockedAt: Date?

    private enum CodingKeys: String, CodingKey {
        case id, name, description, icon, emoji, category, rarity, requirement, unlocked, unlockedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = try c.decode(String.self, forKey: .name)
        self.description = try c.decode(String.self, forKey: .description)
        self.icon = try c.decodeIfPresent(String.self, forKey: .icon)
            ?? c.decodeIfPresent(String.self, forKey: .emoji)
        self.category = try c.decodeIfPresent(String.self, forKey: .category)
        self.rarity = try c.decodeIfPresent(String.self, forKey: .rarity)
        self.requirement = try c.decodeIfPresent(String.self, forKey: .requirement)
        self.unlocked = try c.decodeIfPresent(Bool.self, forKey: .unlocked) ?? false
        self.unlockedAt = try c.decodeIfPresent(Date.self, forKey: .unlockedAt)
    }

    /// Mapped to the iOS `BadgeRarity` enum; falls back to `.common` when the
    /// backend payload omits the field or sends an unrecognized value.
    var rarityTier: BadgeRarity {
        guard let rarity, let tier = BadgeRarity(rawValue: rarity) else {
            return .common
        }
        return tier
    }
}

struct AchievementsSummaryDTO: Decodable, Sendable, Equatable {
    let unlockedBadges: [BadgeDTO]
    let allBadges: [BadgeDTO]
    let totalBadges: Int
    let unlockedCount: Int
    let currentTheme: String
    let currentAvatarFrame: String
}
