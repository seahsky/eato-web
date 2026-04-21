import Foundation

// Minimum fields the Dashboard needs from a food entry. Logging/editing views
// in Phase 2 will add the remaining fields.
struct FoodEntryDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let foodName: String
    let brandName: String?
    let calories: Double
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let servingSize: Double?
    let servingUnit: String?
    let mealType: String?
    let consumedAt: Date
    let approvalStatus: String?
    let loggedByUserId: String?
    let mealGroupId: String?
}
