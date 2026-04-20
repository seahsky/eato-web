import SwiftUI

struct RecipeBuilderView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: RecipeBuilderViewModel?
    @State private var isAddingIngredient: Bool = false
    let onSaved: () -> Void

    var body: some View {
        Group {
            if let vm = viewModel {
                form(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = RecipeBuilderViewModel(api: session.api) }
        }
        .navigationTitle("New recipe")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") { dismiss() }
            }
        }
    }

    @ViewBuilder
    private func form(_ vm: RecipeBuilderViewModel) -> some View {
        @Bindable var vm = vm
        Form {
            Section("Basics") {
                TextField("Name", text: $vm.name)
                HStack {
                    Text("Total yield")
                    Spacer()
                    TextField("Amount", value: $vm.yieldWeight, format: .number.precision(.fractionLength(0...1)))
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 100)
                    Text("g").foregroundStyle(EatoColor.textSecondary)
                }
            }
            Section("Ingredients") {
                if vm.ingredients.isEmpty {
                    Text("Add at least one ingredient")
                        .foregroundStyle(EatoColor.textSecondary)
                } else {
                    ForEach(vm.ingredients) { ing in
                        VStack(alignment: .leading, spacing: Spacing.xxs) {
                            Text(ing.name).font(Typography.bodyMedium)
                            Text("\(Int(ing.quantity))\(ing.unit.rawValue) · \(Int(ing.caloriesPer100g)) kcal/100g")
                                .font(Typography.caption)
                                .foregroundStyle(EatoColor.textSecondary)
                        }
                    }
                    .onDelete { vm.remove(atOffsets: $0) }
                }
                Button { isAddingIngredient = true } label: {
                    Label("Add ingredient", systemImage: "plus")
                }
            }
            if let errorMessage = vm.errorMessage {
                Section { Text(errorMessage).foregroundStyle(EatoColor.danger) }
            }
        }
        .safeAreaInset(edge: .bottom) {
            PrimaryButton("Save recipe", isLoading: vm.isSaving) {
                Task {
                    if await vm.save() != nil { onSaved() }
                }
            }
            .disabled(!vm.canSave)
            .padding(Spacing.lg)
            .background(EatoColor.background)
        }
        .sheet(isPresented: $isAddingIngredient) {
            NavigationStack {
                IngredientSearchView(onPick: { product in
                    vm.add(.fromProduct(product))
                    isAddingIngredient = false
                })
                .navigationTitle("Add ingredient")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Cancel") { isAddingIngredient = false }
                    }
                }
            }
        }
    }
}

struct IngredientSearchView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: FoodSearchViewModel?
    let onPick: (FoodProductDTO) -> Void

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = FoodSearchViewModel(api: session.api) }
        }
    }

    @ViewBuilder
    private func content(_ vm: FoodSearchViewModel) -> some View {
        @Bindable var vm = vm
        VStack(spacing: 0) {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "magnifyingglass").foregroundStyle(EatoColor.textSecondary)
                TextField("Search ingredients", text: $vm.query)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            .padding(Spacing.md)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
            .padding(Spacing.md)

            if vm.isSearching && vm.results.isEmpty {
                ProgressView().padding(.top, Spacing.xxl)
            } else {
                List(vm.results) { product in
                    Button { onPick(product) } label: {
                        VStack(alignment: .leading, spacing: Spacing.xxs) {
                            Text(product.name)
                            if let kcal = product.caloriesPer100g {
                                Text("\(Int(kcal)) kcal/100g")
                                    .font(Typography.caption)
                                    .foregroundStyle(EatoColor.textSecondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
                .listStyle(.plain)
            }
        }
    }
}
