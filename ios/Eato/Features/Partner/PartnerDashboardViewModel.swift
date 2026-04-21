import Foundation
import Observation

@Observable
@MainActor
final class PartnerDashboardViewModel {
    enum LoadState: Equatable { case idle, loading, loaded, failed(APIError) }

    private(set) var state: LoadState = .idle
    private(set) var partnerSummary: DailySummaryDTO?
    private(set) var pendingCount: Int = 0
    private(set) var sendingNudge: Bool = false
    private(set) var lastMessage: String?

    private let api: APIClient
    private let calendar: Calendar

    init(api: APIClient, calendar: Calendar = .current) {
        self.api = api
        self.calendar = calendar
    }

    var todayString: String {
        let f = DateFormatter()
        f.calendar = calendar
        f.timeZone = calendar.timeZone
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    func refresh() async {
        state = .loading
        async let summary = fetch(PartnerAPI.partnerDaily(date: todayString))
        async let count = fetch(PartnerAPI.pendingApprovalsCount)
        let (s, c) = await (summary, count)
        switch s {
        case .success(let value): partnerSummary = value
        case .failure(let error):
            state = .failed(error)
            return
        }
        if case .success(let value) = c { pendingCount = value.count }
        state = .loaded
    }

    func sendNudge() async {
        sendingNudge = true
        defer { sendingNudge = false }
        lastMessage = nil
        do {
            _ = try await api.send(
                Endpoint<SuccessResponse>.post(
                    "auth/send-nudge",
                    body: NudgeBody(type: "log_reminder")
                )
            )
            lastMessage = "Nudge sent."
        } catch let apiError as APIError {
            lastMessage = apiError.errorDescription
        } catch {
            lastMessage = error.localizedDescription
        }
    }

    private struct NudgeBody: Encodable { let type: String }

    private func fetch<R>(_ endpoint: Endpoint<R>) async -> Result<R, APIError> {
        do {
            return .success(try await api.send(endpoint))
        } catch let apiError as APIError {
            return .failure(apiError)
        } catch {
            return .failure(.server(message: error.localizedDescription))
        }
    }
}
