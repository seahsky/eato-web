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
    private(set) var achievements: AchievementsSummaryDTO?
    private(set) var petHealth: PetHealthDTO?

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

    func refresh() async {
        state = .loading
        async let summaryResult = fetch(StatsAPI.daily(date: todayString))
        async let streakResult = fetch(StatsAPI.streak)
        async let achievementsResult = fetch(AchievementsAPI.getAll)
        async let petResult = fetch(PetAPI.getHealth)

        let (s, st, ach, pet) = await (summaryResult, streakResult, achievementsResult, petResult)

        switch s {
        case .success(let value): summary = value
        case .failure(let error):
            state = .failed(error)
            return
        }
        streak = (try? st.get())
        achievements = (try? ach.get())
        petHealth = (try? pet.get())
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
