import SwiftUI
import Charts

struct WeeklyView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: WeekViewModel?

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task {
            if viewModel == nil { viewModel = WeekViewModel(api: session.api) }
            await viewModel?.load()
        }
    }

    @ViewBuilder
    private func content(_ vm: WeekViewModel) -> some View {
        switch vm.state {
        case .idle, .loading where vm.summary == nil:
            ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let error):
            EmptyState(
                systemImage: "exclamationmark.triangle",
                title: "Couldn't load week",
                message: error.errorDescription ?? "",
                action: ("Retry", { Task { await vm.load() } })
            )
        case .loaded, .loading:
            if let summary = vm.summary {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        header(summary)
                            .padding(.horizontal, 24)
                            .padding(.top, 8)

                        weekRing(summary)
                            .padding(.top, 14)

                        statTiles(summary)
                            .padding(.horizontal, 20)

                        chartCard(summary)
                            .padding(.horizontal, 20)

                        motivationalBanner(summary)
                            .padding(.horizontal, 20)

                        Spacer(minLength: 40)
                    }
                }
                .refreshable { await vm.load() }
            }
        }
    }

    // MARK: - Header

    private func header(_ summary: WeeklySummaryDTO) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(rangeLabel(summary).uppercased())
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.4)
            Text("Your week")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func rangeLabel(_ summary: WeeklySummaryDTO) -> String {
        guard let first = summary.days.first?.date, let last = summary.days.last?.date else {
            return ""
        }
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return "\(f.string(from: first)) — \(f.string(from: last))"
    }

    // MARK: - Big ring

    private func weekRing(_ summary: WeeklySummaryDTO) -> some View {
        let weekBudget = max(Int(summary.calorieGoal * 7), 1)
        let weekConsumed = Int(summary.totalCalories)
        return CalorieRing(
            consumed: weekConsumed,
            goal: weekBudget,
            diameter: 200,
            lineWidth: 15
        )
        .frame(maxWidth: .infinity)
    }

    // MARK: - Stat tiles

    private func statTiles(_ summary: WeeklySummaryDTO) -> some View {
        let weekBudget = Int(summary.calorieGoal * 7)
        let weekConsumed = Int(summary.totalCalories)
        let daysCount = max(1, daysWithEntries(summary))
        let dailyAvg = weekConsumed / daysCount
        let remaining = weekBudget - weekConsumed
        return LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 2),
            spacing: 10
        ) {
            statTile(
                label: "Daily avg",
                value: dailyAvg,
                suffix: "kcal / day",
                color: EatoColor.textPrimary
            )
            statTile(
                label: "Remaining",
                value: abs(remaining),
                prefix: remaining < 0 ? "+" : "",
                suffix: remaining >= 0 ? "kcal left" : "kcal over",
                color: remaining >= 0 ? EatoColor.sage : EatoColor.danger
            )
        }
    }

    private func statTile(
        label: String,
        value: Int,
        prefix: String = "",
        suffix: String,
        color: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.0)
            Text("\(prefix)\(value)")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(color)
                .monospacedDigit()
            Text(suffix)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 4)
    }

    // MARK: - Bar chart

    private func chartCard(_ summary: WeeklySummaryDTO) -> some View {
        Card {
            VStack(alignment: .leading, spacing: 14) {
                Text("Daily totals")
                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)

                Chart {
                    ForEach(summary.days) { day in
                        BarMark(
                            x: .value("Day", Self.shortDayLabel(day.date)),
                            y: .value("Calories", day.totalCalories)
                        )
                        .foregroundStyle(
                            day.totalCalories > day.calorieGoal
                                ? EatoColor.danger
                                : EatoColor.terracotta
                        )
                        .cornerRadius(8)
                    }

                    RuleMark(y: .value("Goal", summary.calorieGoal))
                        .foregroundStyle(EatoColor.darkBrown.opacity(0.4))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .top, alignment: .trailing) {
                            Text("Goal")
                                .font(.system(size: 9, weight: .bold, design: .rounded))
                                .foregroundStyle(EatoColor.textTertiary)
                        }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisGridLine().foregroundStyle(EatoColor.divider.opacity(0.5))
                        AxisValueLabel().font(.system(size: 9, weight: .medium, design: .rounded))
                    }
                }
                .chartXAxis {
                    AxisMarks { _ in
                        AxisValueLabel().font(.system(size: 10, weight: .semibold, design: .rounded))
                    }
                }
                .frame(height: 140)
            }
        }
    }

    // MARK: - Motivational sage banner

    private func motivationalBanner(_ summary: WeeklySummaryDTO) -> some View {
        let onGoal = summary.daysOnGoal
        let total = summary.days.count
        let remainingDays = max(0, total - daysWithEntries(summary))
        return VStack(alignment: .leading, spacing: 6) {
            Text(headline(onGoal: onGoal, total: total))
                .font(.system(size: 24, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .lineSpacing(0)
            Text(body(daysLogged: daysWithEntries(summary), remaining: remainingDays))
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .lineSpacing(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(EatoColor.sage.opacity(0.14), in: .rect(cornerRadius: 20))
    }

    private func headline(onGoal: Int, total: Int) -> String {
        switch onGoal {
        case 0: "A fresh start, love."
        case 1...3: "You're warming up."
        case 4...5: "You're right on track, love."
        case 6...: "What a week."
        default: "Keep going."
        }
    }

    private func body(daysLogged: Int, remaining: Int) -> String {
        if remaining == 0 {
            return "Every week is a fresh start."
        }
        return "\(daysLogged) day\(daysLogged == 1 ? "" : "s") logged, and \(remaining) more to go. Every week is a fresh start."
    }

    // MARK: - Helpers

    private func daysWithEntries(_ summary: WeeklySummaryDTO) -> Int {
        summary.days.filter { $0.totalCalories > 0 }.count
    }

    private static func shortDayLabel(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: date)
    }
}
