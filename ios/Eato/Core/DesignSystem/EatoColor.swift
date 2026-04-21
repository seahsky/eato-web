import SwiftUI

// Semantic colour tokens. Phase 0 maps to system-provided colours so the app
// adapts to light/dark without a full asset catalog. Later phases can swap
// individual tokens for custom colorsets without touching call-sites.
enum EatoColor {
    static let background = Color(.systemBackground)
    static let surface = Color(.secondarySystemBackground)
    static let divider = Color(.separator)
    static let textPrimary = Color(.label)
    static let textSecondary = Color(.secondaryLabel)
    static let accent = Color("AccentColor")
    static let accentContrast = Color.white
    static let success = Color.green
    static let warning = Color.orange
    static let danger = Color.red
}
