import SwiftUI

/// Replaces the calendar-grid pattern with the design's expandable list.
/// Streak summary card → month sections → `DayRow` items that expand inline
/// to show 3–5 meal lines from `FoodEntriesAPI.byDate`.
struct HistoryView: View {
    @Environment(SessionStore.self) private var session
    @State private var dayMap: [String: WeeklySummaryDTO.Day] = [:]
    @State private var entriesByDay: [String: [FoodEntryDTO]] = [:]
    @State private var expandedKey: String?
    @State private var loadingDayKey: String?
    @State private var streak: StreakDataDTO?
    @State private var loaded = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                pageHeader
                    .padding(.horizontal, 24)
                    .padding(.top, 8)

                if let streak {
                    streakCard(streak)
                        .padding(.horizontal, 20)
                }

                ForEach(monthBuckets, id: \.title) { bucket in
                    monthSection(bucket)
                }

                if !loaded {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 30)
                }

                Spacer(minLength: 40)
            }
        }
        .task { await load() }
    }

    private var pageHeader: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("LOOKING BACK")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.4)
            Text("History")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Streak summary

    private func streakCard(_ s: StreakDataDTO) -> some View {
        Card {
            HStack(spacing: 14) {
                Circle()
                    .fill(EatoColor.terracotta.opacity(0.14))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: "flame.fill")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(EatoColor.terracotta)
                    )
                VStack(alignment: .leading, spacing: 1) {
                    Text("YOUR BEST STRETCH")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .kerning(0.8)
                    Text("\(s.longestStreak) day\(s.longestStreak == 1 ? "" : "s") in a row")
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                }
                Spacer()
            }
            .padding(.vertical, 4)
        }
    }

    // MARK: - Month section

    @ViewBuilder
    private func monthSection(_ bucket: MonthBucket) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(bucket.title.uppercased())
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.2)
                .padding(.horizontal, 28)

            VStack(spacing: 8) {
                ForEach(bucket.days, id: \.date) { day in
                    DayRow(
                        day: day,
                        isExpanded: expandedKey == Self.key(day.date),
                        isLoadingEntries: loadingDayKey == Self.key(day.date),
                        expandedEntries: entriesByDay[Self.key(day.date)] ?? [],
                        onTap: {
                            Task { await toggle(day: day) }
                        }
                    )
                }
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Data loading

    private var monthBuckets: [MonthBucket] {
        let cal = Calendar.current
        let sorted = dayMap.values.sorted { $0.date > $1.date }
        let grouped = Dictionary(grouping: sorted) { day -> String in
            let f = DateFormatter()
            f.dateFormat = "LLLL yyyy"
            return f.string(from: day.date)
        }
        return grouped
            .map { (title, days) in
                MonthBucket(
                    title: title,
                    days: days.sorted { $0.date > $1.date },
                    sortKey: days.first.map {
                        cal.dateComponents([.year, .month], from: $0.date)
                    } ?? .init()
                )
            }
            .sorted { (a, b) -> Bool in
                let ay = a.sortKey.year ?? 0, am = a.sortKey.month ?? 0
                let by = b.sortKey.year ?? 0, bm = b.sortKey.month ?? 0
                if ay != by { return ay > by }
                return am > bm
            }
    }

    private func load() async {
        guard !loaded else { return }
        let api = session.api
        var collected: [String: WeeklySummaryDTO.Day] = [:]
        async let streakTask: StreakDataDTO? = try? api.send(StatsAPI.streak)
        // Pull the last 4 weeks via chained weekly endpoints (existing pattern).
        for offset in 0..<4 {
            guard let endDate = Calendar.current.date(byAdding: .day, value: -offset * 7, to: Date()) else { continue }
            let endStr = Self.key(endDate)
            if let summary = try? await api.send(StatsAPI.weekly(endDate: endStr)) {
                for d in summary.days {
                    collected[Self.key(d.date)] = d
                }
            }
        }
        dayMap = collected
        streak = await streakTask
        loaded = true
    }

    private func toggle(day: WeeklySummaryDTO.Day) async {
        let key = Self.key(day.date)
        if expandedKey == key {
            expandedKey = nil
            return
        }
        expandedKey = key
        guard entriesByDay[key] == nil, day.totalCalories > 0 else { return }
        loadingDayKey = key
        defer { loadingDayKey = nil }
        if let entries = try? await session.api.send(FoodEntriesAPI.byDate(key)) {
            entriesByDay[key] = entries
        } else {
            entriesByDay[key] = []
        }
    }

    private static func key(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    private struct MonthBucket {
        let title: String
        let days: [WeeklySummaryDTO.Day]
        let sortKey: DateComponents
    }
}

// MARK: - DayRow

private struct DayRow: View {
    let day: WeeklySummaryDTO.Day
    let isExpanded: Bool
    let isLoadingEntries: Bool
    let expandedEntries: [FoodEntryDTO]
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 14) {
                    dateBox
                    VStack(alignment: .leading, spacing: 2) {
                        Text(kcalLine)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(EatoColor.textPrimary)
                        Text(statusLine)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(EatoColor.textTertiary)
                    }
                    Spacer()
                    statusDot
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(EatoColor.textTertiary)
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                if isExpanded && day.totalCalories > 0 {
                    expandedRows
                        .padding(.horizontal, 16)
                        .padding(.bottom, 12)
                }
            }
            .background(EatoColor.surface, in: .rect(cornerRadius: 16))
            .softShadow(elevation: 2)
        }
        .buttonStyle(.plain)
        .animation(.easeInOut(duration: 0.2), value: isExpanded)
    }

    private var dateBox: some View {
        let isToday = Calendar.current.isDateInToday(day.date)
        return VStack(spacing: 0) {
            Text(dayNumber)
                .font(.system(size: 16, weight: .heavy, design: .rounded))
                .foregroundStyle(isToday ? .white : EatoColor.textPrimary)
                .monospacedDigit()
            Text(monthShort.uppercased())
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle((isToday ? Color.white : EatoColor.textSecondary).opacity(0.8))
                .kerning(0.5)
        }
        .frame(width: 42, height: 42)
        .background(
            isToday ? EatoColor.terracotta : EatoColor.surfaceWarm,
            in: .rect(cornerRadius: 12)
        )
    }

    private var statusDot: some View {
        Group {
            if day.totalCalories == 0 {
                Circle()
                    .strokeBorder(EatoColor.divider, lineWidth: 1.5)
            } else if day.goalMet {
                Circle().fill(EatoColor.sage)
            } else {
                Circle().fill(EatoColor.danger.opacity(0.6))
            }
        }
        .frame(width: 10, height: 10)
    }

    @ViewBuilder
    private var expandedRows: some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle()
                .fill(EatoColor.divider.opacity(0.6))
                .frame(height: 1)
                .padding(.bottom, 10)

            if isLoadingEntries {
                HStack { Spacer(); ProgressView(); Spacer() }
                    .padding(.vertical, 8)
            } else if expandedEntries.isEmpty {
                Text("No entries for this day.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .italic()
                    .padding(.vertical, 4)
            } else {
                VStack(spacing: 8) {
                    ForEach(expandedEntries.prefix(5)) { entry in
                        HStack(spacing: 8) {
                            Text(entry.foodName)
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(EatoColor.textSecondary)
                                .lineLimit(1)
                            Spacer()
                            Text("\(Int(entry.calories)) kcal")
                                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                                .foregroundStyle(EatoColor.textTertiary)
                        }
                    }
                }
            }
        }
    }

    private var dayNumber: String {
        let f = DateFormatter()
        f.dateFormat = "d"
        return f.string(from: day.date)
    }

    private var monthShort: String {
        let f = DateFormatter()
        f.dateFormat = "MMM"
        return f.string(from: day.date)
    }

    private var kcalLine: String {
        guard day.totalCalories > 0 else { return "No entries" }
        return "\(Int(day.totalCalories)) kcal"
    }

    private var statusLine: String {
        if day.totalCalories == 0 { return "Rest day" }
        if day.goalMet { return "Within budget" }
        return "A bit over"
    }
}
