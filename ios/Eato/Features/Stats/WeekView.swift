import SwiftUI

struct WeekView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: WeekViewModel?
    @State private var selectedDay: WeeklySummaryDTO.Day?

    var body: some View {
        NavigationStack {
            Group {
                if let vm = viewModel {
                    content(vm)
                } else {
                    ProgressView()
                }
            }
            .task {
                if viewModel == nil { viewModel = WeekViewModel(api: session.api) }
                await viewModel?.load()
            }
            .navigationTitle("Week")
            .navigationDestination(item: $selectedDay) { day in
                HistoryDayView(date: day.date, calorieGoal: day.calorieGoal)
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: WeekViewModel) -> some View {
        switch vm.state {
        case .loading where vm.summary == nil, .idle:
            ProgressView().padding(.top, Spacing.xxxl)
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
                        headerStats(summary: summary)
                        Divider()
                        dayList(summary: summary)
                    }
                    .padding(Spacing.lg)
                }
                .refreshable { await vm.load() }
            }
        }
    }

    private func headerStats(summary: WeeklySummaryDTO) -> some View {
        HStack(spacing: Spacing.md) {
            StatCell(label: "Avg/day", value: "\(summary.averageCalories) kcal")
            StatCell(label: "On goal", value: "\(summary.daysOnGoal)/7")
            StatCell(label: "Goal", value: "\(Int(summary.calorieGoal)) kcal")
        }
    }

    private func dayList(summary: WeeklySummaryDTO) -> some View {
        VStack(spacing: Spacing.sm) {
            ForEach(summary.days) { day in
                Button { selectedDay = day } label: {
                    DayRow(day: day)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct StatCell: View {
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: Spacing.xxs) {
            Text(label).font(Typography.caption).foregroundStyle(EatoColor.textSecondary)
            Text(value).font(Typography.titleSmall).monospacedDigit()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }
}

private struct DayRow: View {
    let day: WeeklySummaryDTO.Day

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: Spacing.xxs) {
                Text(formattedDate).font(Typography.bodyMedium)
                progressBar
            }
            Spacer()
            VStack(alignment: .trailing, spacing: Spacing.xxs) {
                Text("\(Int(day.totalCalories)) kcal")
                    .font(Typography.monoDigits)
                if day.goalMet {
                    Text("On goal")
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.success)
                }
            }
            Image(systemName: "chevron.right")
                .foregroundStyle(EatoColor.textSecondary)
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
    }

    private var formattedDate: String {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        return f.string(from: day.date)
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2).fill(EatoColor.divider)
                RoundedRectangle(cornerRadius: 2)
                    .fill(day.goalMet ? EatoColor.success : EatoColor.accent)
                    .frame(width: min(1, day.totalCalories / max(1, day.calorieGoal)) * geo.size.width)
            }
        }
        .frame(height: 4)
    }
}
