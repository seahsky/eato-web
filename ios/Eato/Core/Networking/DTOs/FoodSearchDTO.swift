import Foundation

enum FoodDataSource: String, Codable, Sendable {
    case fatSecret = "FATSECRET"
    case manual = "MANUAL"
    case openFoodFacts = "OPEN_FOOD_FACTS"
    case usda = "USDA"
}

// Matches the food-search service shape the web client already consumes.
// Field set is permissive — unknown keys are dropped by Codable defaults.
struct FoodProductDTO: Decodable, Sendable, Identifiable, Equatable {
    let id: String
    let name: String
    let brand: String?
    let barcode: String?
    let imageUrl: String?
    let caloriesPer100g: Double?
    let proteinPer100g: Double?
    let carbsPer100g: Double?
    let fatPer100g: Double?
    let fiberPer100g: Double?
    let servingSize: Double?
    let servingUnit: String?
    let servingCalories: Double?
    let servingProtein: Double?
    let servingCarbs: Double?
    let servingFat: Double?
    let dataSource: FoodDataSource?
    let fatSecretId: String?

    enum CodingKeys: String, CodingKey {
        case id, name, brand, barcode, imageUrl, dataSource, fatSecretId
        case caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g
        case servingSize, servingUnit
        case servingCalories = "servingCalories"
        case servingProtein = "servingProtein"
        case servingCarbs = "servingCarbs"
        case servingFat = "servingFat"
    }
}

struct FoodSearchResponse: Decodable, Sendable {
    let products: [FoodProductDTO]
    let hasMore: Bool?
}

struct AnalyzedItem: Decodable, Sendable, Identifiable {
    let query: String
    let products: [FoodProductDTO]

    var id: String { query }
}
