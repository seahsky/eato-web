import Foundation
import Observation

@Observable
@MainActor
final class DashboardViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(APIError)
    }

    private(set) var state: LoadState = .idle
    /// Daily summary for the day the user is currently viewing
    /// (default = today; may switch when they tap a `WeekStrip` pill).
    private(set) var summary: DailySummaryDTO?
    private(set) var streak: StreakDataDTO?
    private(set) var weekly: WeeklySummaryDTO?

    /// The day currently displayed by the dashboard. Set via `setViewedDay(_:)`.
    private(set) var viewedDay: Date

    private let api: APIClient
    private let calendar: Calendar
    private let dateProvider: () -> Date

    init(
        api: APIClient,
        calendar: Calendar = .current,
        dateProvider: @escaping () -> Date = Date.init
    ) {
        self.api = api
        self.calendar = calendar
        self.dateProvider = dateProvider
        self.viewedDay = dateProvider()
    }

    var todayString: String {
        Self.dayKey(dateProvider(), calendar: calendar)
    }

    var viewedDayString: String {
        Self.dayKey(viewedDay, calendar: calendar)
    }

    var isViewingToday: Bool {
        viewedDayString == todayString
    }

    var caloriesRemaining: Double {
        guard let summary else { return 0 }
        return max(0, summary.calorieGoal - summary.totalCalories)
    }

    var goalProgress: Double {
        guard let summary, summary.calorieGoal > 0 else { return 0 }
        return min(1, summary.totalCalories / summary.calorieGoal)
    }

    var hasLoggedAnything: Bool {
        (summary?.entries.isEmpty == false)
    }

    /// Reverse-chronological ordering — newest first — to match the
    /// design's "today leads with the AddCard, then most recent meal".
    var entriesNewestFirst: [FoodEntryDTO] {
        (summary?.entries ?? []).sorted { $0.consumedAt > $1.consumedAt }
    }

    /// Day-key set populated from the weekly summary so `WeekStrip` can show
    /// a green dot on days the user logged at least one entry.
    var loggedDays: Set<String> {
        guard let weekly else { return [] }
        var keys: Set<String> = []
        for day in weekly.days where day.totalCalories > 0 {
            keys.insert(Self.dayKey(day.date, calendar: calendar))
        }
        return keys
    }

    func setViewedDay(_ date: Date) async {
        viewedDay = date
        await loadDailySummary()
    }

    func goToToday() async {
        await setViewedDay(dateProvider())
    }

    func refresh() async {
        state = .loading
        async let summaryResult = fetch(StatsAPI.daily(date: viewedDayString))
        async let streakResult = fetch(StatsAPI.streak)
        async let weeklyResult = fetch(StatsAPI.weekly(endDate: todayString))

        let (s, st, w) = await (summaryResult, streakResult, weeklyResult)

        switch s {
        case .success(let value): summary = value
        case .failure(let error):
            state = .failed(error)
            return
        }
        streak = (try? st.get())
        weekly = (try? w.get())
        state = .loaded
    }

    /// Used when the user taps a different `WeekStrip` pill — only the daily
    /// summary changes, the weekly + streak data is fetched at refresh time.
    private func loadDailySummary() async {
        state = .loading
        let result = await fetch(StatsAPI.daily(date: viewedDayString))
        switch result {
        case .success(let value):
            summary = value
            state = .loaded
        case .failure(let error):
            state = .failed(error)
        }
    }

    private func fetch<R>(_ endpoint: Endpoint<R>) async -> Result<R, APIError> {
        do {
            return .success(try await api.send(endpoint))
        } catch let apiError as APIError {
            return .failure(apiError)
        } catch {
            return .failure(.server(message: error.localizedDescription))
        }
    }

    private static func dayKey(_ date: Date, calendar: Calendar) -> String {
        let f = DateFormatter()
        f.calendar = calendar
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = calendar.timeZone
        return f.string(from: date)
    }

    #if DEBUG
    func _debugInject(summary: DailySummaryDTO) { self.summary = summary }
    func _debugInject(weekly: WeeklySummaryDTO) { self.weekly = weekly }
    func _debugInject(viewedDay date: Date) { self.viewedDay = date }
    #endif
}
