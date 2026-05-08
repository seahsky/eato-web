import XCTest
@testable import Eato

@MainActor
final class OnboardingViewModelTests: XCTestCase {
    func test_canAdvance_basics_gatesOnAge() {
        let vm = makeVM()
        vm.age = 12
        XCTAssertFalse(vm.canAdvance)
        vm.age = 28
        XCTAssertTrue(vm.canAdvance)
        vm.age = 121
        XCTAssertFalse(vm.canAdvance)
    }

    func test_stepProgression_runsThroughAllFourSteps() async {
        let vm = makeVM()
        XCTAssertEqual(vm.step, .basics)
        await vm.advance()
        XCTAssertEqual(vm.step, .body)
        await vm.advance()
        XCTAssertEqual(vm.step, .activity)
        await vm.advance()
        XCTAssertEqual(vm.step, .goal)
    }

    func test_goBack_movesPreviousStep() async {
        let vm = makeVM()
        await vm.advance()
        vm.goBack()
        XCTAssertEqual(vm.step, .basics)
    }

    func test_goBack_fromFirstStep_isNoOp() {
        let vm = makeVM()
        vm.goBack()
        XCTAssertEqual(vm.step, .basics)
    }

    // MARK: - Phase 7d additions

    func test_advance_fromGoal_landsOnSummary_thenSubmits() async {
        let vm = makeVM()
        // Walk to .goal
        await vm.advance() // basics -> body
        await vm.advance() // body -> activity
        await vm.advance() // activity -> goal
        XCTAssertEqual(vm.step, .goal)
        // .goal -> .summary
        await vm.advance()
        XCTAssertEqual(vm.step, .summary)
        // .summary stays put after submit (success path triggers onComplete, not a step change)
        await vm.advance()
        XCTAssertEqual(vm.step, .summary)
    }

    func test_estimatedBMR_male_matchesMifflinStJeor() {
        let vm = makeVM()
        vm.gender = .male
        vm.weightKg = 80
        vm.heightCm = 180
        vm.age = 30
        // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
        XCTAssertEqual(vm.estimatedBMR, 1780)
    }

    func test_estimatedBMR_female_matchesMifflinStJeor() {
        let vm = makeVM()
        vm.gender = .female
        vm.weightKg = 60
        vm.heightCm = 165
        vm.age = 28
        // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
        XCTAssertEqual(vm.estimatedBMR, 1330)
    }

    func test_weeklyTarget_isDailyGoalTimesSeven() {
        let vm = makeVM()
        vm.calorieGoal = 1850
        XCTAssertEqual(vm.weeklyTarget, 12_950)
    }

    private func makeVM() -> OnboardingViewModel {
        OnboardingViewModel(
            api: APIClient(
                baseURL: URL(string: "https://eato.test/api/rest/")!,
                session: SilentSession(),
                interceptor: AuthInterceptor(provider: SilentToken())
            ),
            onComplete: {}
        )
    }
}

private actor SilentSession: URLSessionProtocol {
    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        (
            Data(#"{"bmr":1400,"tdee":2100,"suggestedGoal":2100}"#.utf8),
            HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
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
