import SwiftUI

struct AddFoodView: View {
    enum Route: Hashable {
        case search
        case manual
        case barcode
        case photo
        case recipes
        case mealEstimate
    }

    @State private var path: [Route] = []
    @State private var searchText: String = ""

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                EatoColor.background.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.lg) {
                        header
                        searchField
                        quickActions
                        describeYourself
                        Spacer(minLength: Spacing.xxl)
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.md)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Add to diary".uppercased())
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.2)
            Text("What did you eat?")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
        }
    }

    private var searchField: some View {
        Button {
            path.append(.search)
        } label: {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(EatoColor.terracotta)
                Text("Search foods")
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.md)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        }
        .buttonStyle(.plain)
        .softShadow(elevation: 6)
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader("Quick add")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Spacing.md) {
                actionTile(
                    icon: "barcode.viewfinder",
                    title: "Scan",
                    subtitle: "Barcode",
                    tint: EatoColor.terracotta
                ) { path.append(.barcode) }

                actionTile(
                    icon: "camera.fill",
                    title: "Photo",
                    subtitle: "AI estimate",
                    tint: EatoColor.sage
                ) { path.append(.photo) }

                actionTile(
                    icon: "pencil",
                    title: "Manual",
                    subtitle: "Custom entry",
                    tint: EatoColor.warning
                ) { path.append(.manual) }

                actionTile(
                    icon: "book.closed.fill",
                    title: "Recipes",
                    subtitle: "Saved meals",
                    tint: EatoColor.terracotta
                ) { path.append(.recipes) }
            }
        }
    }

    private var describeYourself: some View {
        Button {
            path.append(.mealEstimate)
        } label: {
            HStack(spacing: Spacing.md) {
                ZStack {
                    Circle()
                        .fill(EatoColor.surfaceWarm)
                        .frame(width: 44, height: 44)
                    Image(systemName: "text.word.spacing")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(EatoColor.darkBrown)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Describe it yourself")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text("Paste ingredients, get a calorie estimate.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                        .lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            .padding(Spacing.md)
            .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: Radius.lg))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.lg)
                    .strokeBorder(EatoColor.divider, style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
            )
        }
        .buttonStyle(.plain)
    }

    private func actionTile(
        icon: String,
        title: String,
        subtitle: String,
        tint: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.16))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(tint)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Spacing.md)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        }
        .buttonStyle(.plain)
        .softShadow(elevation: 4)
    }
}
