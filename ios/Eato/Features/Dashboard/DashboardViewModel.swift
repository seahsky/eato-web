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
    private(set) var summary: DailySummaryDTO?
    private(set) var streak: StreakDataDTO?
    private(set) var weekly: WeeklySummaryDTO?

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
    }

    var todayString: String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = calendar.timeZone
        return formatter.string(from: dateProvider())
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

    /// Diary entries sorted ascending by consumedAt — drives the timeline rail.
    var timelineEntries: [FoodEntryDTO] {
        (summary?.entries ?? []).sorted { $0.consumedAt < $1.consumedAt }
    }

    /// Apply a meal-type filter and return entries in timeline order.
    func filteredEntries(_ filter: DiaryFilter) -> [FoodEntryDTO] {
        let base = timelineEntries
        switch filter {
        case .all: return base
        default: return base.filter { ($0.mealType ?? "") == filter.rawValue }
        }
    }

    func refresh() async {
        state = .loading
        async let summaryResult = fetch(StatsAPI.daily(date: todayString))
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

    private func fetch<R>(_ endpoint: Endpoint<R>) async -> Result<R, APIError> {
        do {
            return .success(try await api.send(endpoint))
        } catch let apiError as APIError {
            return .failure(apiError)
        } catch {
            return .failure(.server(message: error.localizedDescription))
        }
    }

    #if DEBUG
    func _debugInject(summary: DailySummaryDTO) { self.summary = summary }
    #endif
}
