import SwiftUI

struct RecipesListView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: RecipesListViewModel?
    @State private var isBuildingNew: Bool = false

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = RecipesListViewModel(api: session.api) }
            await viewModel?.load()
        }
        .navigationTitle("Recipes")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { isBuildingNew = true } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $isBuildingNew) {
            NavigationStack {
                RecipeBuilderView(onSaved: {
                    isBuildingNew = false
                    Task { await viewModel?.load() }
                })
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: RecipesListViewModel) -> some View {
        switch vm.state {
        case .idle, .loading where vm.list == nil:
            ProgressView().padding(.top, Spacing.xxxl)
        case .failed(let error):
            EmptyState(
                systemImage: "exclamationmark.triangle",
                title: "Couldn't load recipes",
                message: error.errorDescription ?? "",
                action: ("Retry", { Task { await vm.load() } })
            )
        case .loaded, .loading:
            if let list = vm.list, list.userRecipes.isEmpty && list.partnerRecipes.isEmpty {
                EmptyState(
                    systemImage: "fork.knife.circle",
                    title: "No recipes yet",
                    message: "Tap + to save your first one."
                )
            } else if let list = vm.list {
                List {
                    if !list.userRecipes.isEmpty {
                        Section("Mine") {
                            ForEach(list.userRecipes) { recipe in
                                NavigationLink(value: recipe) {
                                    RecipeRow(recipe: recipe)
                                }
                            }
                            .onDelete { indexSet in
                                for i in indexSet {
                                    Task { await vm.delete(list.userRecipes[i]) }
                                }
                            }
                        }
                    }
                    if !list.partnerRecipes.isEmpty {
                        Section("Partner's") {
                            ForEach(list.partnerRecipes) { recipe in
                                NavigationLink(value: recipe) {
                                    RecipeRow(recipe: recipe)
                                }
                            }
                        }
                    }
                }
                .navigationDestination(for: RecipeDTO.self) { recipe in
                    RecipeDetailView(recipe: recipe)
                }
                .refreshable { await vm.load() }
            }
        }
    }
}

private struct RecipeRow: View {
    let recipe: RecipeDTO

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(recipe.name).font(Typography.bodyMedium)
            Text(
                "\(Int(recipe.caloriesPer100g)) kcal/100g · "
                + "\(recipe.ingredients.count) ingredient\(recipe.ingredients.count == 1 ? "" : "s")"
            )
            .font(Typography.caption)
            .foregroundStyle(EatoColor.textSecondary)
        }
    }
}

extension RecipeDTO: Hashable {
    public func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
