import SwiftUI

/// A scrollable months calendar. Each day shows a small dot tinted by goalMet.
/// Tap a day to drill into HistoryDayView.
struct HistoryView: View {
    @Environment(SessionStore.self) private var session
    @State private var monthOffset: Int = 0 // 0 = current month, -1 = previous, etc.
    @State private var dayMap: [String: WeeklySummaryDTO.Day] = [:]
    @State private var selectedDay: Date?
    @State private var loading: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                ForEach((0...3).reversed(), id: \.self) { offset in
                    monthSection(offset: offset)
                }
                Spacer(minLength: Spacing.xxl)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.sm)
        }
        .task { await load() }
        .navigationDestination(item: $selectedDay) { date in
            HistoryDayView(
                date: date,
                calorieGoal: dayMap[Self.key(date)]?.calorieGoal ?? 2000
            )
        }
    }

    private func monthSection(offset: Int) -> some View {
        let firstOfMonth = Self.firstOfMonth(monthsAgo: offset)
        let weeks = Self.calendarWeeks(forMonthStarting: firstOfMonth)

        return VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(Self.monthTitle(firstOfMonth))
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)

            HStack(spacing: 0) {
                ForEach(["S", "M", "T", "W", "T", "F", "S"], id: \.self) { d in
                    Text(d)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .frame(maxWidth: .infinity)
                }
            }

            VStack(spacing: 6) {
                ForEach(0..<weeks.count, id: \.self) { i in
                    HStack(spacing: 0) {
                        ForEach(0..<7, id: \.self) { j in
                            cell(for: weeks[i][j], inMonth: firstOfMonth)
                        }
                    }
                }
            }
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 4)
    }

    @ViewBuilder
    private func cell(for date: Date?, inMonth firstOfMonth: Date) -> some View {
        if let date {
            let key = Self.key(date)
            let day = dayMap[key]
            let inMonth = Calendar.current.isDate(date, equalTo: firstOfMonth, toGranularity: .month)
            let isToday = Calendar.current.isDateInToday(date)

            Button {
                selectedDay = date
            } label: {
                VStack(spacing: 2) {
                    Text("\(Calendar.current.component(.day, from: date))")
                        .font(.system(size: 12, weight: isToday ? .bold : .semibold, design: .rounded))
                        .foregroundStyle(
                            inMonth ? (isToday ? EatoColor.terracotta : EatoColor.textPrimary)
                                    : EatoColor.textTertiary.opacity(0.5)
                        )
                    Circle()
                        .fill(dotColor(day: day))
                        .frame(width: 4, height: 4)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 32)
            }
            .buttonStyle(.plain)
            .disabled(!inMonth)
        } else {
            Color.clear.frame(maxWidth: .infinity).frame(height: 32)
        }
    }

    private func dotColor(day: WeeklySummaryDTO.Day?) -> Color {
        guard let day else { return Color.clear }
        if day.goalMet { return EatoColor.sage }
        if day.totalCalories > 0 { return EatoColor.terracotta.opacity(0.6) }
        return Color.clear
    }

    private func load() async {
        guard !loading else { return }
        loading = true
        defer { loading = false }
        // Pull last ~28 days via /stats/weekly endpoints anchored at four weeks
        // back; merge into a date-keyed map. Cheap enough for the small range.
        let api = session.api
        var collected: [String: WeeklySummaryDTO.Day] = [:]
        for offset in 0..<4 {
            let endDate = Calendar.current.date(byAdding: .day, value: -offset * 7, to: Date()) ?? Date()
            let endStr = Self.iso(endDate)
            if let summary = try? await api.send(StatsAPI.weekly(endDate: endStr)) {
                for d in summary.days {
                    collected[Self.key(d.date)] = d
                }
            }
        }
        dayMap = collected
    }

    // MARK: - Date helpers

    private static func firstOfMonth(monthsAgo offset: Int) -> Date {
        let cal = Calendar.current
        let now = Date()
        let comps = cal.dateComponents([.year, .month], from: now)
        let firstThisMonth = cal.date(from: comps) ?? now
        return cal.date(byAdding: .month, value: -offset, to: firstThisMonth) ?? firstThisMonth
    }

    private static func calendarWeeks(forMonthStarting first: Date) -> [[Date?]] {
        let cal = Calendar.current
        let range = cal.range(of: .day, in: .month, for: first)?.count ?? 30
        // Calendar weekday: 1 = Sunday. We want a 0-based offset where Sun = 0.
        let firstWeekday = cal.component(.weekday, from: first) - 1
        var weeks: [[Date?]] = []
        var current: [Date?] = Array(repeating: nil, count: firstWeekday)

        for day in 1...range {
            if let date = cal.date(byAdding: .day, value: day - 1, to: first) {
                current.append(date)
            }
            if current.count == 7 {
                weeks.append(current)
                current = []
            }
        }
        if !current.isEmpty {
            while current.count < 7 { current.append(nil) }
            weeks.append(current)
        }
        return weeks
    }

    private static func monthTitle(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "LLLL yyyy"
        return f.string(from: date)
    }

    private static func key(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    private static func iso(_ date: Date) -> String {
        key(date)
    }
}
