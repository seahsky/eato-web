import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}

enum EatoColor {
    static let terracotta = Color(hex: 0xC4704B)
    static let terracottaSoft = Color(hex: 0xE8B89A)
    static let sage = Color(hex: 0x6A9D72)
    static let sageSoft = Color(hex: 0xC2D9C5)
    static let cream = Color(hex: 0xFDF8F4)
    static let darkBrown = Color(hex: 0x3D2A1F)

    static let background = cream
    static let surface = Color(hex: 0xFFFFFF)
    static let surfaceWarm = Color(hex: 0xFAF1E8)
    static let divider = Color(hex: 0xEADBCB)
    static let textPrimary = darkBrown
    static let textSecondary = Color(hex: 0x8B7563)
    static let textTertiary = Color(hex: 0xB39A85)
    static let accent = terracotta
    static let accentSoft = terracottaSoft
    static let accentContrast = Color.white
    static let success = sage
    static let successSoft = sageSoft
    static let warning = Color(hex: 0xE0A040)
    static let danger = Color(hex: 0xB44E3F)
}
