import Foundation
import Observation

struct LogEntrySeed: Hashable {
    var name: String
    var brand: String?
    var barcode: String?
    var imageUrl: String?
    var caloriesPer100g: Double?
    var proteinPer100g: Double?
    var carbsPer100g: Double?
    var fatPer100g: Double?
    var fiberPer100g: Double?
    var servingSize: Double
    var servingUnit: String
    var dataSource: FoodDataSource
    var fatSecretId: String?

    init(product: FoodProductDTO) {
        self.name = product.name
        self.brand = product.brand
        self.barcode = product.barcode
        self.imageUrl = product.imageUrl
        self.caloriesPer100g = product.caloriesPer100g
        self.proteinPer100g = product.proteinPer100g
        self.carbsPer100g = product.carbsPer100g
        self.fatPer100g = product.fatPer100g
        self.fiberPer100g = product.fiberPer100g
        self.servingSize = product.servingSize ?? 100
        self.servingUnit = product.servingUnit ?? "g"
        self.dataSource = product.dataSource ?? .fatSecret
        self.fatSecretId = product.fatSecretId
    }

    init(manual name: String) {
        self.name = name
        self.brand = nil
        self.barcode = nil
        self.imageUrl = nil
        self.caloriesPer100g = nil
        self.proteinPer100g = nil
        self.carbsPer100g = nil
        self.fatPer100g = nil
        self.fiberPer100g = nil
        self.servingSize = 100
        self.servingUnit = "g"
        self.dataSource = .manual
        self.fatSecretId = nil
    }
}

@Observable
@MainActor
final class LogEntryViewModel {
    var seed: LogEntrySeed
    var servingAmount: Double
    var mealType: MealType = .breakfast
    var dateString: String
    var mealGroupId: String?

    // Manual calorie/macro override (if the seed has no per-100g data).
    var caloriesOverride: Double = 0
    var proteinOverride: Double = 0
    var carbsOverride: Double = 0
    var fatOverride: Double = 0

    private(set) var isSaving: Bool = false
    private(set) var errorMessage: String?

    private let api: APIClient

    init(seed: LogEntrySeed, api: APIClient, now: Date = Date()) {
        self.seed = seed
        self.servingAmount = seed.servingSize
        self.api = api
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        self.dateString = f.string(from: now)
        if seed.dataSource == .manual {
            self.caloriesOverride = 0
        }
    }

    var isManual: Bool { seed.dataSource == .manual }

    var computedCalories: Double {
        if isManual { return caloriesOverride }
        guard let per100 = seed.caloriesPer100g else { return 0 }
        return (per100 * servingAmount) / 100
    }

    var computedProtein: Double? {
        if isManual { return proteinOverride }
        guard let per100 = seed.proteinPer100g else { return nil }
        return (per100 * servingAmount) / 100
    }

    var computedCarbs: Double? {
        if isManual { return carbsOverride }
        guard let per100 = seed.carbsPer100g else { return nil }
        return (per100 * servingAmount) / 100
    }

    var computedFat: Double? {
        if isManual { return fatOverride }
        guard let per100 = seed.fatPer100g else { return nil }
        return (per100 * servingAmount) / 100
    }

    var canSave: Bool {
        !seed.name.isEmpty && servingAmount > 0 && computedCalories > 0
    }

    func log() async -> FoodEntryDTO? {
        guard canSave else { return nil }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil

        let request = LogEntryRequest(
            name: seed.name,
            barcode: seed.barcode,
            brand: seed.brand,
            imageUrl: seed.imageUrl,
            calories: computedCalories,
            protein: computedProtein,
            carbs: computedCarbs,
            fat: computedFat,
            fiber: nil,
            servingSize: servingAmount,
            servingUnit: seed.servingUnit,
            mealGroupId: mealGroupId,
            consumedAt: dateString,
            isManualEntry: isManual,
            dataSource: seed.dataSource,
            fatSecretId: seed.fatSecretId
        )

        do {
            return try await api.send(FoodAPI.logEntry(request))
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        return nil
    }
}
