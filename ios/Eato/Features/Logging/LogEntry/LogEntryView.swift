import SwiftUI

struct LogEntryView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: LogEntryViewModel?
    let seed: LogEntrySeed
    let onLogged: (FoodEntryDTO) -> Void

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = LogEntryViewModel(seed: seed, api: session.api)
            }
        }
        .navigationTitle("Log meal")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(_ vm: LogEntryViewModel) -> some View {
        @Bindable var vm = vm
        Form {
            Section {
                VStack(alignment: .leading, spacing: Spacing.xxs) {
                    Text(vm.seed.name).font(Typography.titleSmall)
                    if let brand = vm.seed.brand {
                        Text(brand)
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.textSecondary)
                    }
                }
            }
            Section("Serving") {
                HStack {
                    TextField(
                        "Amount",
                        value: $vm.servingAmount,
                        format: .number.precision(.fractionLength(0...1))
                    )
                    .keyboardType(.decimalPad)
                    Text(vm.seed.servingUnit).foregroundStyle(EatoColor.textSecondary)
                }
            }
            Section("Meal") {
                Picker("Meal", selection: $vm.mealType) {
                    ForEach(MealType.allCases, id: \.self) { Text($0.label).tag($0) }
                }
            }
            Section("Nutrition") {
                if vm.isManual {
                    NutritionField(label: "Calories", unit: "kcal", value: $vm.caloriesOverride)
                    NutritionField(label: "Protein", unit: "g", value: $vm.proteinOverride)
                    NutritionField(label: "Carbs", unit: "g", value: $vm.carbsOverride)
                    NutritionField(label: "Fat", unit: "g", value: $vm.fatOverride)
                } else {
                    LabeledContent("Calories", value: "\(Int(vm.computedCalories)) kcal")
                    if let p = vm.computedProtein { LabeledContent("Protein", value: "\(Int(p))g") }
                    if let c = vm.computedCarbs { LabeledContent("Carbs", value: "\(Int(c))g") }
                    if let f = vm.computedFat { LabeledContent("Fat", value: "\(Int(f))g") }
                }
            }
            if let errorMessage = vm.errorMessage {
                Section {
                    Text(errorMessage).foregroundStyle(EatoColor.danger)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            PrimaryButton(
                vm.isManual ? "Log" : "Log \(Int(vm.computedCalories)) kcal",
                isLoading: vm.isSaving
            ) {
                Task {
                    if let entry = await vm.log() {
                        onLogged(entry)
                        dismiss()
                    }
                }
            }
            .disabled(!vm.canSave)
            .padding(Spacing.lg)
            .background(EatoColor.background)
        }
    }
}

private struct NutritionField: View {
    let label: String
    let unit: String
    @Binding var value: Double

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            TextField(label, value: $value, format: .number.precision(.fractionLength(0...1)))
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 100)
            Text(unit).foregroundStyle(EatoColor.textSecondary)
        }
    }
}
