import SwiftUI
import PhotosUI

struct PhotoAnalyzeView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: PhotoAnalyzeViewModel?
    @State private var pickerItem: PhotosPickerItem?
    @State private var selectedSeed: LogEntrySeed?
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
            if viewModel == nil { viewModel = PhotoAnalyzeViewModel(api: session.api) }
        }
        .navigationTitle("Analyse photo")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $selectedSeed) { seed in
            LogEntryView(seed: seed, onLogged: { _ in onDismiss() })
        }
    }

    @ViewBuilder
    private func content(_ vm: PhotoAnalyzeViewModel) -> some View {
        VStack(spacing: Spacing.lg) {
            switch vm.stage {
            case .picking:
                picker(vm)
            case .analysing:
                VStack(spacing: Spacing.md) {
                    ProgressView()
                    Text("Looking at your meal…").font(Typography.bodyMedium)
                }
                .frame(maxHeight: .infinity)
            case .review(let items):
                reviewList(items: items)
            case .failed(let message):
                EmptyState(
                    systemImage: "exclamationmark.triangle",
                    title: "Couldn't analyse",
                    message: message,
                    action: ("Try again", { vm.setValue(.picking) })
                )
            }
        }
        .padding(Spacing.lg)
    }

    @ViewBuilder
    private func picker(_ vm: PhotoAnalyzeViewModel) -> some View {
        VStack(spacing: Spacing.md) {
            EmptyState(
                systemImage: "camera.fill",
                title: "Share a photo",
                message: "Take a photo of your plate and we'll estimate what's on it."
            )
            PhotosPicker(selection: $pickerItem, matching: .images) {
                Label("Choose photo", systemImage: "photo")
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(.borderedProminent)
            .tint(EatoColor.accent)
            .onChange(of: pickerItem) { _, new in
                Task {
                    guard let data = try? await new?.loadTransferable(type: Data.self),
                          let image = UIImage(data: data) else { return }
                    await vm.analyse(image: image)
                }
            }
        }
    }

    @ViewBuilder
    private func reviewList(items: [AnalyzedItem]) -> some View {
        if items.isEmpty {
            EmptyState(
                systemImage: "fork.knife",
                title: "Nothing detected",
                message: "Try a closer photo or enter the meal manually."
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("Tap the best match for each item.")
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                    ForEach(items) { item in
                        AnalyzedItemSection(item: item, onSelect: { product in
                            selectedSeed = LogEntrySeed(product: product)
                        })
                    }
                }
            }
        }
    }
}

private struct AnalyzedItemSection: View {
    let item: AnalyzedItem
    let onSelect: (FoodProductDTO) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(item.query).font(Typography.titleSmall)
            if item.products.isEmpty {
                Text("No matches found.")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
            } else {
                ForEach(item.products) { product in
                    Button { onSelect(product) } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: Spacing.xxs) {
                                Text(product.name)
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
                        .padding(Spacing.md)
                        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// Small helper so the "Try again" action in EmptyState can push the VM
// back to the picking stage without the view touching state directly.
extension PhotoAnalyzeViewModel {
    func setValue(_ stage: Stage) { self.stage = stage }
}
