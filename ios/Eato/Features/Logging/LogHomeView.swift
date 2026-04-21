import SwiftUI

struct LogHomeView: View {
    enum Route: Hashable {
        case search
        case manual
        case barcode
        case photo
        case recipes
        case mealEstimate
    }

    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            VStack(spacing: Spacing.md) {
                LogCard(
                    icon: "magnifyingglass",
                    title: "Search foods",
                    subtitle: "FatSecret database"
                ) { path.append(.search) }
                LogCard(
                    icon: "barcode.viewfinder",
                    title: "Scan barcode",
                    subtitle: "Point at packaging"
                ) { path.append(.barcode) }
                LogCard(
                    icon: "camera.fill",
                    title: "Analyse photo",
                    subtitle: "AI-powered meal estimate"
                ) { path.append(.photo) }
                LogCard(
                    icon: "pencil",
                    title: "Manual entry",
                    subtitle: "For custom meals"
                ) { path.append(.manual) }
                LogCard(
                    icon: "book.closed",
                    title: "Recipes",
                    subtitle: "Build once, log a portion any time"
                ) { path.append(.recipes) }
                LogCard(
                    icon: "text.word.spacing",
                    title: "Meal estimator",
                    subtitle: "Paste ingredients, get an estimate"
                ) { path.append(.mealEstimate) }
                Spacer()
            }
            .padding(Spacing.lg)
            .navigationTitle("Log")
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .search: FoodSearchView(onDismiss: { path.removeAll() })
                case .manual: ManualEntryView(onDismiss: { path.removeAll() })
                case .barcode: BarcodeScanView(onDismiss: { path.removeAll() })
                case .photo: PhotoAnalyzeView(onDismiss: { path.removeAll() })
                case .recipes: RecipesListView()
                case .mealEstimate: MealEstimationView()
                }
            }
        }
    }
}

private struct LogCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                ZStack {
                    Circle().fill(EatoColor.accent.opacity(0.12))
                    Image(systemName: icon).foregroundStyle(EatoColor.accent)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: Spacing.xxs) {
                    Text(title).font(Typography.titleSmall)
                    Text(subtitle)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(EatoColor.textSecondary)
            }
            .padding(Spacing.lg)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        }
        .buttonStyle(.plain)
    }
}
