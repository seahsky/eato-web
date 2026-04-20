import Foundation

struct MealIngredientInput: Encodable, Sendable {
    let rawLine: String
    let ingredientName: String
    let quantity: Double
    let unit: String
    let normalizedGrams: Double
    let matchedProductId: String?
    let matchedProductName: String?
    let matchedProductBrand: String?
    let dataSource: FoodDataSource?
    let caloriesPer100g: Double?
    let proteinPer100g: Double?
    let carbsPer100g: Double?
    let fatPer100g: Double?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let hasMatch: Bool
    let parseError: String?
    let sortOrder: Int
}

struct CreateMealEstimationRequest: Encodable, Sendable {
    let rawInputText: String
    let name: String
    let totalCalories: Double
    let totalProtein: Double
    let totalCarbs: Double
    let totalFat: Double
    let totalGrams: Double
    let ingredients: [MealIngredientInput]
    let foodEntryId: String?
}

struct BatchSearchRequest: Encodable, Sendable {
    let queries: [Query]
    struct Query: Encodable, Sendable {
        let id: String
        let query: String
    }
}

struct BatchSearchResultItem: Decodable, Sendable {
    let id: String
    let query: String
    let products: [FoodProductDTO]
    let error: String?
}
