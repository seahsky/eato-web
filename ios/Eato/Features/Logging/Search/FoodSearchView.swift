import SwiftUI

struct FoodSearchView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: FoodSearchViewModel?
    @State private var selection: FoodProductDTO?
    let onDismiss: () -> Void

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
        .navigationTitle("Search foods")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(_ vm: FoodSearchViewModel) -> some View {
        @Bindable var vm = vm
        VStack(spacing: 0) {
            SearchBar(text: $vm.query, placeholder: "Search foods (e.g. banana)")
                .padding(Spacing.md)

            if vm.isSearching && vm.results.isEmpty {
                ProgressView().padding(.top, Spacing.xxl)
            } else if vm.results.isEmpty && !vm.query.isEmpty {
                EmptyState(
                    systemImage: "magnifyingglass",
                    title: "No results",
                    message: "Try a different spelling or brand."
                )
            } else {
                List {
                    ForEach(vm.results) { product in
                        Button { selection = product } label: {
                            FoodRow(product: product)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .listStyle(.plain)
            }
        }
        .sheet(item: $selection) { product in
            NavigationStack {
                SearchPhotoThenLog(product: product) {
                    selection = nil
                    onDismiss()
                }
            }
        }
    }
}

/// Inside the search sheet's NavigationStack: capture photo, then push log.
private struct SearchPhotoThenLog: View {
    let product: FoodProductDTO
    let onDismiss: () -> Void
    @State private var seed: LogEntrySeed?

    var body: some View {
        PhotoCaptureStep(title: "Snap your \(product.name)") { url in
            var s = LogEntrySeed(product: product)
            s.imageUrl = url
            seed = s
        }
        .navigationDestination(item: $seed) { seed in
            LogEntryView(seed: seed, onLogged: { _ in onDismiss() })
        }
    }
}

private struct FoodRow: View {
    let product: FoodProductDTO

    var body: some View {
        HStack(spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: Spacing.xxs) {
                Text(product.name).font(Typography.bodyMedium)
                if let brand = product.brand {
                    Text(brand)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
            }
            Spacer()
            if let kcal = product.servingCalories ?? product.caloriesPer100g {
                Text("\(Int(kcal)) kcal")
                    .font(Typography.monoDigits)
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}

private struct SearchBar: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(EatoColor.textSecondary)
            TextField(placeholder, text: $text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            if !text.isEmpty {
                Button { text = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(EatoColor.textSecondary)
                }
            }
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }
}
