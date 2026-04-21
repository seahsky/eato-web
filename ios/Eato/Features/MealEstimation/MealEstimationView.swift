import SwiftUI

struct MealEstimationView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: MealEstimationViewModel?

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = MealEstimationViewModel(api: session.api) }
        }
        .navigationTitle("Meal estimator")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(_ vm: MealEstimationViewModel) -> some View {
        @Bindable var vm = vm
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                Text("Paste one ingredient per line — e.g. `200g chicken`.")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
                TextField("Meal name", text: $vm.mealName)
                    .textFieldStyle(.roundedBorder)
                TextEditor(text: $vm.rawText)
                    .font(Typography.bodyMedium)
                    .frame(minHeight: 160)
                    .padding(Spacing.sm)
                    .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))

                PrimaryButton("Estimate", isLoading: vm.isLookingUp) {
                    Task { await vm.parseAndLookup() }
                }
                .disabled(vm.rawText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                if !vm.lines.isEmpty {
                    summary(vm)
                    ForEach(vm.lines) { line in
                        LineRow(line: line)
                    }
                }

                if let errorMessage = vm.errorMessage {
                    Text(errorMessage).foregroundStyle(EatoColor.danger)
                }
            }
            .padding(Spacing.lg)
        }
        .safeAreaInset(edge: .bottom) {
            if !vm.lines.isEmpty {
                PrimaryButton(vm.savedAt == nil ? "Save estimate" : "Saved ✓", isLoading: vm.isSaving) {
                    Task {
                        if await vm.save() { dismiss() }
                    }
                }
                .disabled(vm.savedAt != nil)
                .padding(Spacing.lg)
                .background(EatoColor.background)
            }
        }
    }

    private func summary(_ vm: MealEstimationViewModel) -> some View {
        HStack {
            Text("Total").font(Typography.titleSmall)
            Spacer()
            Text("\(Int(vm.totalCalories)) kcal · \(Int(vm.totalGrams))g")
                .font(Typography.monoDigits)
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }
}

private struct LineRow: View {
    let line: MealEstimationViewModel.Line

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(line.parsed.rawLine).font(Typography.bodyMedium)
            if let error = line.parsed.parseError {
                Text(error).font(Typography.caption).foregroundStyle(EatoColor.danger)
            } else if let match = line.match {
                Text(match.name)
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
                let kcal = (match.caloriesPer100g ?? 0) * line.parsed.normalizedGrams / 100
                Text("≈ \(Int(kcal)) kcal").font(Typography.caption)
            } else {
                Text("No match — will save as 0 kcal")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.warning)
            }
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }
}
