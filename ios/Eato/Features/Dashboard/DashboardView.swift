import SwiftUI

struct DashboardView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: DashboardViewModel?

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
                viewModel = DashboardViewModel(api: session.api)
            }
            await viewModel?.refresh()
        }
    }

    @ViewBuilder
    private func content(_ vm: DashboardViewModel) -> some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                header

                switch vm.state {
                case .idle, .loading where vm.summary == nil:
                    ProgressView().padding(.top, Spacing.xxxl)
                case .failed(let error) where vm.summary == nil:
                    EmptyState(
                        systemImage: "exclamationmark.triangle",
                        title: "Couldn't load today",
                        message: error.errorDescription ?? "Please try again.",
                        action: ("Retry", { Task { await vm.refresh() } })
                    )
                default:
                    if let summary = vm.summary {
                        dashboardBody(vm: vm, summary: summary)
                    }
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxl)
        }
        .background(EatoColor.background)
        .refreshable { await vm.refresh() }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 0) {
                Text("Today")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
                Text(formattedDate)
                    .font(Typography.titleLarge)
            }
            Spacer()
        }
        .padding(.top, Spacing.lg)
    }

    @ViewBuilder
    private func dashboardBody(vm: DashboardViewModel, summary: DailySummaryDTO) -> some View {
        VStack(spacing: Spacing.lg) {
            CalorieRingView(consumed: summary.totalCalories, goal: summary.calorieGoal)
                .padding(.vertical, Spacing.md)

            HStack(spacing: Spacing.md) {
                MacroChip(label: "P", value: summary.totalProtein, unit: "g")
                MacroChip(label: "C", value: summary.totalCarbs, unit: "g")
                MacroChip(label: "F", value: summary.totalFat, unit: "g")
            }

            if let streak = vm.streak {
                StreakCardView(streak: streak)
            }

            if !summary.entries.isEmpty {
                recentEntries(summary.entries.prefix(5))
            } else {
                EmptyState(
                    systemImage: "fork.knife",
                    title: "Nothing logged yet",
                    message: "Tap the + tab to log your first meal."
                )
            }

            if let achievements = vm.achievements, !achievements.allBadges.isEmpty {
                AchievementsShelfView(summary: achievements)
            }
        }
    }

    @ViewBuilder
    private func recentEntries(_ entries: ArraySlice<FoodEntryDTO>) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Recent")
                .font(Typography.titleSmall)
            ForEach(Array(entries)) { entry in
                HStack {
                    VStack(alignment: .leading, spacing: Spacing.xxs) {
                        Text(entry.foodName).font(Typography.bodyMedium)
                        if let brand = entry.brandName {
                            Text(brand)
                                .font(Typography.caption)
                                .foregroundStyle(EatoColor.textSecondary)
                        }
                    }
                    Spacer()
                    Text("\(Int(entry.calories)) kcal").font(Typography.monoDigits)
                }
                .padding(Spacing.md)
                .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
            }
        }
    }

    private var formattedDate: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: Date())
    }
}

private struct MacroChip: View {
    let label: String
    let value: Double
    let unit: String

    var body: some View {
        VStack(spacing: Spacing.xxs) {
            Text(label).font(Typography.caption).foregroundStyle(EatoColor.textSecondary)
            Text("\(Int(value))\(unit)").font(Typography.titleSmall)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.sm)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }
}
