import Foundation

enum IngredientUnit: String, Codable, CaseIterable, Sendable {
    case grams = "g"
    case kilograms = "kg"
    case milliliters = "ml"
    case liters = "L"
    case percent = "%"
}

struct RecipeIngredientDTO: Decodable, Sendable, Identifiable, Equatable {
    let id: String
    let name: String
    let quantity: Double
    let unit: IngredientUnit
    let isPercentage: Bool
    let baseIngredientId: String?
    let caloriesPer100g: Double
    let proteinPer100g: Double
    let carbsPer100g: Double
    let fatPer100g: Double
    let fiberPer100g: Double
    let isManualEntry: Bool
    let sortOrder: Int
}

struct RecipeDTO: Decodable, Sendable, Identifiable, Equatable {
    let id: String
    let userId: String
    let name: String
    let description: String?
    let imageUrl: String?
    let yieldWeight: Double
    let yieldUnit: String
    let caloriesPer100g: Double
    let proteinPer100g: Double
    let carbsPer100g: Double
    let fatPer100g: Double
    let fiberPer100g: Double
    let createdAt: Date
    let updatedAt: Date
    let ingredients: [RecipeIngredientDTO]
}

struct RecipesListDTO: Decodable, Sendable {
    let userRecipes: [RecipeDTO]
    let partnerRecipes: [RecipeDTO]
}

struct CreateRecipeRequest: Encodable, Sendable {
    let name: String
    let description: String?
    let imageUrl: String?
    let yieldWeight: Double
    let yieldUnit: String
    let ingredients: [IngredientInput]

    struct IngredientInput: Encodable, Sendable {
        let name: String
        let quantity: Double
        let unit: IngredientUnit
        let isPercentage: Bool
        let baseIngredientId: String?
        let caloriesPer100g: Double
        let proteinPer100g: Double
        let carbsPer100g: Double
        let fatPer100g: Double
        let fiberPer100g: Double
        let isManualEntry: Bool
        let sortOrder: Int
    }
}

struct LogRecipeRequest: Encodable, Sendable {
    let recipeId: String
    let consumedWeight: Double
    let consumedAt: String
}
