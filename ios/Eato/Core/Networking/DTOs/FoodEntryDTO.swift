import Foundation

/// Mirrors the Prisma `FoodEntry` row returned verbatim by `stats.daily.entries`
/// and `food/entries/by-date`. The Swift property names use the iOS-native
/// `foodName`/`brandName` form for readability, but the wire format uses
/// `name`/`brand` (Prisma field names) — explicit `CodingKeys` bridge them.
/// Without this bridge the dashboard silently fails to decode and shows empty
/// state for any user with logged entries.
struct FoodEntryDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let foodName: String
    let brandName: String?
    let imageUrl: String?
    let calories: Double
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let servingSize: Double?
    let servingUnit: String?
    let mealType: String?
    let mood: String?
    let note: String?
    let consumedAt: Date
    let mealGroupId: String?

    enum CodingKeys: String, CodingKey {
        case id
        case foodName = "name"
        case brandName = "brand"
        case imageUrl
        case calories
        case protein
        case carbs
        case fat
        case servingSize
        case servingUnit
        case mealType
        case mood
        case note
        case consumedAt
        case mealGroupId
    }
}
