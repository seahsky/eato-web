import SwiftUI

enum Typography {
    static let displayLarge = Font.system(size: 34, weight: .bold, design: .rounded)
    static let titleLarge = Font.system(size: 28, weight: .semibold, design: .rounded)
    static let titleMedium = Font.system(size: 22, weight: .semibold, design: .rounded)
    static let titleSmall = Font.system(size: 17, weight: .semibold, design: .rounded)
    static let body = Font.system(size: 17, weight: .regular)
    static let bodyMedium = Font.system(size: 15, weight: .regular)
    static let caption = Font.system(size: 13, weight: .regular)
    static let monoDigits = Font.system(size: 17, weight: .semibold).monospacedDigit()
}
