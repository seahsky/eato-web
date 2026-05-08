import SwiftUI

/// Mirrors the design's `RARITY` table (`more.jsx`). Earned badges glow with a
/// rarity-tinted shadow; unearned ones render at 50% opacity grayscale.
enum BadgeRarity: String, Codable, Sendable, CaseIterable {
    case common, uncommon, rare, epic, legendary

    var label: String {
        switch self {
        case .common: "Common"
        case .uncommon: "Uncommon"
        case .rare: "Rare"
        case .epic: "Epic"
        case .legendary: "Legendary"
        }
    }

    /// Tint used for the icon ring and the rarity label.
    var tint: Color {
        switch self {
        case .common: Color(red: 0x9B / 255, green: 0x86 / 255, blue: 0x76 / 255)
        case .uncommon: Color(red: 0x8F / 255, green: 0xC2 / 255, blue: 0x98 / 255)
        case .rare: Color(red: 0x6B / 255, green: 0x95 / 255, blue: 0xC9 / 255)
        case .epic: Color(red: 0xA4 / 255, green: 0x76 / 255, blue: 0xC9 / 255)
        case .legendary: Color(red: 0xD4 / 255, green: 0xA0 / 255, blue: 0x4E / 255)
        }
    }

    /// Glow opacity around the badge tile when earned.
    var glowOpacity: Double {
        switch self {
        case .common: 0.0
        case .uncommon: 0.20
        case .rare: 0.30
        case .epic: 0.40
        case .legendary: 0.50
        }
    }
}
