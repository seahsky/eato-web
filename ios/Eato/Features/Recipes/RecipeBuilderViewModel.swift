import Foundation
import Observation

@Observable
@MainActor
final class RecipeBuilderViewModel {
    struct DraftIngredient: Identifiable, Equatable {
        let id: UUID
        var name: String
        var quantity: Double
        var unit: IngredientUnit
        var caloriesPer100g: Double
        var proteinPer100g: Double
        var carbsPer100g: Double
        var fatPer100g: Double
        var fiberPer100g: Double
        var isManualEntry: Bool

        static func fromProduct(_ product: FoodProductDTO) -> DraftIngredient {
            .init(
                id: UUID(),
                name: product.name,
                quantity: product.servingSize ?? 100,
                unit: .grams,
                caloriesPer100g: product.caloriesPer100g ?? 0,
                proteinPer100g: product.proteinPer100g ?? 0,
                carbsPer100g: product.carbsPer100g ?? 0,
                fatPer100g: product.fatPer100g ?? 0,
                fiberPer100g: product.fiberPer100g ?? 0,
                isManualEntry: false
            )
        }
    }

    var name: String = ""
    var yieldWeight: Double = 500
    var ingredients: [DraftIngredient] = []
    private(set) var isSaving: Bool = false
    private(set) var errorMessage: String?

    private let api: APIClient

    init(api: APIClient) { self.api = api }

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && yieldWeight > 0
            && !ingredients.isEmpty
    }

    func add(_ ingredient: DraftIngredient) {
        ingredients.append(ingredient)
    }

    func remove(atOffsets offsets: IndexSet) {
        ingredients.remove(atOffsets: offsets)
    }

    func save() async -> RecipeDTO? {
        guard canSave else { return nil }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        let body = CreateRecipeRequest(
            name: name,
            description: nil,
            imageUrl: nil,
            yieldWeight: yieldWeight,
            yieldUnit: "g",
            ingredients: ingredients.enumerated().map { idx, ing in
                .init(
                    name: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    isPercentage: ing.unit == .percent,
                    baseIngredientId: nil,
                    caloriesPer100g: ing.caloriesPer100g,
                    proteinPer100g: ing.proteinPer100g,
                    carbsPer100g: ing.carbsPer100g,
                    fatPer100g: ing.fatPer100g,
                    fiberPer100g: ing.fiberPer100g,
                    isManualEntry: ing.isManualEntry,
                    sortOrder: idx
                )
            }
        )
        do {
            return try await api.send(RecipeAPI.create(body))
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        return nil
    }
}
