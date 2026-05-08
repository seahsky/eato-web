import XCTest
@testable import Eato

@MainActor
final class DashboardViewModelTests: XCTestCase {
    func test_todayString_usesUTCCalendarDate() {
        let vm = DashboardViewModel(
            api: makeAPI(session: EmptySession()),
            calendar: utcCalendar,
            dateProvider: { Date(timeIntervalSince1970: 1_714_007_160) } // 2024-04-25 01:06 UTC
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

    // MARK: - Phase 7b additions

    func test_entriesNewestFirst_sortsDescendingByConsumedAt() {
        let vm = DashboardViewModel(api: makeAPI(session: EmptySession()))
        let now = Date(timeIntervalSince1970: 1_714_000_000)
        let earlier = Date(timeIntervalSince1970: 1_713_990_000)
        let earliest = Date(timeIntervalSince1970: 1_713_980_000)
        let summary = DailySummaryDTO(
            date: now, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
            totalFiber: 0, calorieGoal: 2000, bmr: nil, tdee: nil,
            entries: [
                makeEntry(id: "old", consumedAt: earliest, calories: 100),
                makeEntry(id: "new", consumedAt: now, calories: 300),
                makeEntry(id: "mid", consumedAt: earlier, calories: 200),
            ]
        )
        vm._debugInject(summary: summary)
        XCTAssertEqual(vm.entriesNewestFirst.map(\.id), ["new", "mid", "old"])
    }

    func test_loggedDays_includesOnlyDaysWithEntries() {
        let vm = DashboardViewModel(api: makeAPI(session: EmptySession()), calendar: utcCalendar)
        let weekly = WeeklySummaryDTO(
            days: [
                .init(date: dateUTC("2026-04-15"), totalCalories: 1500, totalProtein: 0, totalCarbs: 0, totalFat: 0, calorieGoal: 2000, goalMet: true),
                .init(date: dateUTC("2026-04-16"), totalCalories: 0,    totalProtein: 0, totalCarbs: 0, totalFat: 0, calorieGoal: 2000, goalMet: false),
                .init(date: dateUTC("2026-04-17"), totalCalories: 1900, totalProtein: 0, totalCarbs: 0, totalFat: 0, calorieGoal: 2000, goalMet: true),
            ],
            averageCalories: 1133, totalCalories: 3400, daysOnGoal: 2, calorieGoal: 2000
        )
        vm._debugInject(weekly: weekly)
        XCTAssertEqual(vm.loggedDays, ["2026-04-15", "2026-04-17"])
    }

    func test_isViewingToday_flipsWhenViewedDayMatchesProvider() {
        let now = Date(timeIntervalSince1970: 1_714_007_160) // 2024-04-25 UTC
        let vm = DashboardViewModel(
            api: makeAPI(session: EmptySession()),
            calendar: utcCalendar,
            dateProvider: { now }
        )
        XCTAssertTrue(vm.isViewingToday)
        let yesterday = now.addingTimeInterval(-86_400)
        vm._debugInject(viewedDay: yesterday)
        XCTAssertFalse(vm.isViewingToday)
    }

    private func makeEntry(id: String, consumedAt: Date, calories: Double) -> FoodEntryDTO {
        FoodEntryDTO(
            id: id, foodName: "x", brandName: nil, imageUrl: nil, calories: calories,
            protein: nil, carbs: nil, fat: nil, servingSize: nil, servingUnit: nil,
            mealType: nil, mood: nil, note: nil, consumedAt: consumedAt, mealGroupId: nil
        )
    }

    private func dateUTC(_ ymd: String) -> Date {
        let f = DateFormatter()
        f.calendar = utcCalendar
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = utcCalendar.timeZone
        return f.date(from: ymd) ?? Date(timeIntervalSince1970: 0)
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
