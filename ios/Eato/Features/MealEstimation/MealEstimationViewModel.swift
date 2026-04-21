import Foundation
import Observation

@Observable
@MainActor
final class MealEstimationViewModel {
    struct Line: Identifiable {
        let parsed: MealParser.Parsed
        var match: FoodProductDTO?
        var customCalories: Double?

        var id: String { parsed.id }
    }

    var rawText: String = ""
    var mealName: String = "Meal"
    private(set) var lines: [Line] = []
    private(set) var isLookingUp: Bool = false
    private(set) var isSaving: Bool = false
    private(set) var errorMessage: String?
    private(set) var savedAt: Date?

    private let api: APIClient

    init(api: APIClient) { self.api = api }

    var totalCalories: Double {
        lines.reduce(0) { $0 + calories(for: $1) }
    }

    var totalGrams: Double {
        lines.reduce(0) { $0 + $1.parsed.normalizedGrams }
    }

    private func calories(for line: Line) -> Double {
        if let custom = line.customCalories { return custom }
        if let per100 = line.match?.caloriesPer100g {
            return per100 * line.parsed.normalizedGrams / 100
        }
        return 0
    }

    func parseAndLookup() async {
        let parsed = MealParser.parse(rawText)
        lines = parsed.map { .init(parsed: $0, match: nil, customCalories: nil) }
        guard !lines.isEmpty else { return }
        isLookingUp = true
        defer { isLookingUp = false }
        let body = BatchSearchRequest(
            queries: lines
                .filter { $0.parsed.parseError == nil }
                .map { .init(id: $0.id, query: $0.parsed.ingredientName) }
        )
        guard !body.queries.isEmpty else { return }
        do {
            let results = try await api.send(FoodAPI.batchSearch(body))
            for result in results {
                guard let idx = lines.firstIndex(where: { $0.id == result.id }),
                      let top = result.products.first
                else { continue }
                lines[idx].match = top
            }
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setMatch(_ product: FoodProductDTO, for line: Line) {
        guard let idx = lines.firstIndex(where: { $0.id == line.id }) else { return }
        lines[idx].match = product
        lines[idx].customCalories = nil
    }

    func setCustomCalories(_ calories: Double, for line: Line) {
        guard let idx = lines.firstIndex(where: { $0.id == line.id }) else { return }
        lines[idx].customCalories = calories
    }

    func save() async -> Bool {
        guard !lines.isEmpty else { return false }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil

        let ingredients: [MealIngredientInput] = lines.enumerated().map { idx, line in
            let kcal = calories(for: line)
            let match = line.match
            let per = match?.caloriesPer100g
            let protein = match?.proteinPer100g.map { $0 * line.parsed.normalizedGrams / 100 } ?? 0
            let carbs = match?.carbsPer100g.map { $0 * line.parsed.normalizedGrams / 100 } ?? 0
            let fat = match?.fatPer100g.map { $0 * line.parsed.normalizedGrams / 100 } ?? 0
            return MealIngredientInput(
                rawLine: line.parsed.rawLine,
                ingredientName: line.parsed.ingredientName,
                quantity: line.parsed.quantity,
                unit: line.parsed.unit,
                normalizedGrams: line.parsed.normalizedGrams,
                matchedProductId: match?.id,
                matchedProductName: match?.name,
                matchedProductBrand: match?.brand,
                dataSource: match?.dataSource,
                caloriesPer100g: per,
                proteinPer100g: match?.proteinPer100g,
                carbsPer100g: match?.carbsPer100g,
                fatPer100g: match?.fatPer100g,
                calories: kcal,
                protein: protein,
                carbs: carbs,
                fat: fat,
                hasMatch: match != nil,
                parseError: line.parsed.parseError,
                sortOrder: idx
            )
        }

        let body = CreateMealEstimationRequest(
            rawInputText: rawText,
            name: mealName.trimmingCharacters(in: .whitespaces).isEmpty ? "Meal" : mealName,
            totalCalories: totalCalories,
            totalProtein: ingredients.reduce(0) { $0 + $1.protein },
            totalCarbs: ingredients.reduce(0) { $0 + $1.carbs },
            totalFat: ingredients.reduce(0) { $0 + $1.fat },
            totalGrams: totalGrams,
            ingredients: ingredients,
            foodEntryId: nil
        )

        do {
            _ = try await api.send(MealEstimationAPI.create(body))
            savedAt = Date()
            return true
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        return false
    }
}
