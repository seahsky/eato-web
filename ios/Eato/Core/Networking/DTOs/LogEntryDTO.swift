import Foundation

enum MealType: String, Codable, CaseIterable, Sendable {
    case breakfast = "BREAKFAST"
    case lunch = "LUNCH"
    case dinner = "DINNER"
    case snack = "SNACK"

    var label: String {
        switch self {
        case .breakfast: "Breakfast"
        case .lunch: "Lunch"
        case .dinner: "Dinner"
        case .snack: "Snack"
        }
    }
}

struct LogEntryRequest: Encodable, Sendable {
    let name: String
    let barcode: String?
    let brand: String?
    let imageUrl: String?
    let calories: Double
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let fiber: Double?
    let servingSize: Double
    let servingUnit: String
    let mealGroupId: String?
    let consumedAt: String
    let isManualEntry: Bool
    let dataSource: FoodDataSource
    let fatSecretId: String?
}
