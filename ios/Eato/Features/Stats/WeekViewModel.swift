import Foundation
import Observation

@Observable
@MainActor
final class WeekViewModel {
    enum LoadState: Equatable {
        case idle, loading, loaded, failed(APIError)
    }

    private(set) var state: LoadState = .idle
    private(set) var summary: WeeklySummaryDTO?

    private let api: APIClient
    private let calendar: Calendar

    init(api: APIClient, calendar: Calendar = .current) {
        self.api = api
        self.calendar = calendar
    }

    func load(endingOn date: Date = Date()) async {
        state = .loading
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        do {
            summary = try await api.send(StatsAPI.weekly(endDate: formatter.string(from: date)))
            state = .loaded
        } catch let apiError as APIError {
            state = .failed(apiError)
        } catch {
            state = .failed(.server(message: error.localizedDescription))
        }
    }
}
