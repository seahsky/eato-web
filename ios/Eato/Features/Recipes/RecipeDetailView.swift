import SwiftUI

struct RecipeDetailView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var portionGrams: Double = 100
    @State private var isLogging: Bool = false
    @State private var logError: String?
    @State private var didLog: Bool = false
    let recipe: RecipeDTO

    var body: some View {
        Form {
            Section("Per 100g") {
                LabeledContent("Calories", value: "\(Int(recipe.caloriesPer100g)) kcal")
                LabeledContent("Protein", value: "\(Int(recipe.proteinPer100g)) g")
                LabeledContent("Carbs", value: "\(Int(recipe.carbsPer100g)) g")
                LabeledContent("Fat", value: "\(Int(recipe.fatPer100g)) g")
            }
            Section("Ingredients") {
                ForEach(recipe.ingredients) { ing in
                    HStack {
                        Text(ing.name)
                        Spacer()
                        Text(quantityLabel(ing))
                            .foregroundStyle(EatoColor.textSecondary)
                    }
                }
            }
            Section("Log a portion") {
                HStack {
                    Text("Amount")
                    Spacer()
                    TextField("Amount", value: $portionGrams, format: .number.precision(.fractionLength(0...1)))
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 100)
                    Text("g").foregroundStyle(EatoColor.textSecondary)
                }
                LabeledContent(
                    "Calories",
                    value: "\(Int(recipe.caloriesPer100g * portionGrams / 100)) kcal"
                )
                if let logError {
                    Text(logError).foregroundStyle(EatoColor.danger).font(Typography.caption)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            PrimaryButton(didLog ? "Logged ✓" : "Log portion", isLoading: isLogging) {
                Task { await log() }
            }
            .disabled(portionGrams <= 0 || didLog)
            .padding(Spacing.lg)
            .background(EatoColor.background)
        }
        .navigationTitle(recipe.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func quantityLabel(_ ing: RecipeIngredientDTO) -> String {
        let q = Int(ing.quantity)
        return "\(q)\(ing.unit.rawValue)"
    }

    private func log() async {
        isLogging = true
        defer { isLogging = false }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        do {
            _ = try await session.api.send(RecipeAPI.logPortion(
                .init(
                    recipeId: recipe.id,
                    consumedWeight: portionGrams,
                    consumedAt: f.string(from: Date())
                )
            ))
            didLog = true
        } catch let apiError as APIError {
            logError = apiError.errorDescription
        } catch {
            logError = error.localizedDescription
        }
    }
}
