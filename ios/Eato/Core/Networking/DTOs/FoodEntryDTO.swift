import Foundation

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
}
