import XCTest
@testable import Eato

@MainActor
final class DashboardViewModelTests: XCTestCase {
    func test_todayString_usesUTCCalendarDate() {
        let vm = DashboardViewModel(
            api: makeAPI(session: EmptySession()),
            calendar: utcCalendar,
            dateProvider: { Date(timeIntervalSince1970: 1_714_000_000) } // 2024-04-25 01:06 UTC
        )
        XCTAssertEqual(vm.todayString, "2024-04-25")
    }

    func test_goalProgress_capsAtOne() {
        let vm = DashboardViewModel(api: makeAPI(session: EmptySession()))
        let summary = DailySummaryDTO(
            date: Date(),
            totalCalories: 3000, totalProtein: 0, totalCarbs: 0, totalFat: 0,
            totalFiber: 0, calorieGoal: 2000, bmr: nil, tdee: nil, entries: []
        )
        vm._debugInject(summary: summary)
        XCTAssertEqual(vm.goalProgress, 1.0)
    }

    func test_refresh_failureOnDailySummary_setsFailed() async {
        let vm = DashboardViewModel(api: makeAPI(session: AlwaysServerError()))
        await vm.refresh()
        guard case .failed = vm.state else {
            XCTFail("Expected .failed, got \(vm.state)")
            return
        }
    }

    private var utcCalendar: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        return cal
    }

    private func makeAPI(session: URLSessionProtocol) -> APIClient {
        APIClient(
            baseURL: URL(string: "https://eato.test/api/rest/")!,
            session: session,
            interceptor: AuthInterceptor(provider: SilentToken())
        )
    }
}

// MARK: - Test doubles
private actor EmptySession: URLSessionProtocol {
    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        (
            Data("{}".utf8),
            HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
        )
    }
}

private actor AlwaysServerError: URLSessionProtocol {
    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        (
            Data(#"{"message":"boom"}"#.utf8),
            HTTPURLResponse(
                url: request.url!,
                statusCode: 500,
                httpVersion: nil,
                headerFields: nil
            )!
        )
    }
}

private struct SilentToken: AuthTokenProvider {
    func token() async -> String? { nil }
    func refresh() async throws {}
    func forceSignOut() async {}
}
