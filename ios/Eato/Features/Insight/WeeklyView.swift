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
                    VStack(alignment: .leading, spacing: Spacing.lg) {
                        statRow(summary)
                        chartCard(summary)
                        dayCards(summary)
                        Spacer(minLength: Spacing.xxl)
                    }
                    .padding(.horizontal, Spacing.lg)
                    .padding(.top, Spacing.sm)
                }
                .refreshable { await vm.load() }
            }
        }
    }

    private func statRow(_ summary: WeeklySummaryDTO) -> some View {
        HStack(spacing: Spacing.sm) {
            statTile(label: "Avg/day", value: "\(summary.averageCalories)", suffix: "kcal")
            statTile(label: "On goal", value: "\(summary.daysOnGoal)", suffix: "of 7")
            statTile(label: "Daily goal", value: "\(Int(summary.calorieGoal))", suffix: "kcal")
        }
    }

    private func statTile(label: String, value: String, suffix: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.0)
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .monospacedDigit()
                Text(suffix)
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.sm)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
        .softShadow(elevation: 4)
    }

    private func chartCard(_ summary: WeeklySummaryDTO) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.md) {
                HStack {
                    Text("Last 7 days")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Spacer()
                    Text("kcal vs goal")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                Chart {
                    ForEach(summary.days) { day in
                        BarMark(
                            x: .value("Day", Self.shortDayLabel(day.date)),
                            y: .value("Calories", day.totalCalories)
                        )
                        .foregroundStyle(day.goalMet ? EatoColor.sage : EatoColor.terracotta)
                        .cornerRadius(4)
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
                    AxisMarks(position: .leading) { value in
                        AxisGridLine()
                            .foregroundStyle(EatoColor.divider.opacity(0.5))
                        AxisValueLabel()
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                    }
                }
                .chartXAxis {
                    AxisMarks { value in
                        AxisValueLabel()
                            .font(.system(size: 9, weight: .semibold, design: .rounded))
                    }
                }
                .frame(height: 180)
            }
        }
    }

    private func dayCards(_ summary: WeeklySummaryDTO) -> some View {
        VStack(spacing: Spacing.sm) {
            SectionHeader("Daily breakdown")
            ForEach(summary.days) { day in
                NavigationLink {
                    HistoryDayView(date: day.date, calorieGoal: day.calorieGoal)
                } label: {
                    DayCard(day: day)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private static func shortDayLabel(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: date)
    }
}

private struct DayCard: View {
    let day: WeeklySummaryDTO.Day

    private var progress: Double {
        guard day.calorieGoal > 0 else { return 0 }
        return min(1.5, day.totalCalories / day.calorieGoal)
    }

    var body: some View {
        HStack(spacing: Spacing.md) {
            VStack(alignment: .leading, spacing: 2) {
                Text(formattedDate)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("\(Int(day.totalCalories)) of \(Int(day.calorieGoal)) kcal")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                progressBar
                    .frame(height: 4)
                    .padding(.top, 2)
            }
            Spacer()
            if day.goalMet {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(EatoColor.sage)
            }
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(EatoColor.textTertiary)
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
        .softShadow(elevation: 3)
    }

    private var formattedDate: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: day.date)
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(EatoColor.divider.opacity(0.5))
                Capsule()
                    .fill(day.goalMet ? EatoColor.sage : EatoColor.terracotta)
                    .frame(width: min(1.0, progress) * geo.size.width)
            }
        }
    }
}
