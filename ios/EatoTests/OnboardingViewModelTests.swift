import XCTest
@testable import Eato

@MainActor
final class OnboardingViewModelTests: XCTestCase {
    func test_canAdvance_age_gatesOnRange() {
        let vm = makeVM()
        // Walk to age step.
        for _ in 0..<3 { vm.step = next(after: vm.step) ?? vm.step }
        XCTAssertEqual(vm.step, .age)

        vm.age = 13
        XCTAssertFalse(vm.canAdvance)
        vm.age = 28
        XCTAssertTrue(vm.canAdvance)
        vm.age = 91
        XCTAssertFalse(vm.canAdvance)
    }

    func test_canAdvance_height_gatesOnRange() {
        let vm = makeVM()
        vm.step = .height

        vm.heightCm = 119
        XCTAssertFalse(vm.canAdvance)
        vm.heightCm = 165
        XCTAssertTrue(vm.canAdvance)
        vm.heightCm = 221
        XCTAssertFalse(vm.canAdvance)
    }

    func test_canAdvance_weight_gatesOnRange() {
        let vm = makeVM()
        vm.step = .weight

        vm.weightKg = 34
        XCTAssertFalse(vm.canAdvance)
        vm.weightKg = 65
        XCTAssertTrue(vm.canAdvance)
        vm.weightKg = 161
        XCTAssertFalse(vm.canAdvance)
    }

    func test_stepProgression_walksGenderToSummary() async {
        let vm = makeVM()
        XCTAssertEqual(vm.step, .gender)
        await vm.advance()
        XCTAssertEqual(vm.step, .height)
        await vm.advance()
        XCTAssertEqual(vm.step, .weight)
        await vm.advance()
        XCTAssertEqual(vm.step, .age)
        await vm.advance()
        XCTAssertEqual(vm.step, .activity)
        await vm.advance()
        XCTAssertEqual(vm.step, .summary)
    }

    func test_goBack_movesPreviousStep() async {
        let vm = makeVM()
        await vm.advance()
        vm.goBack()
        XCTAssertEqual(vm.step, .gender)
    }

    func test_goBack_fromFirstStep_isNoOp() {
        let vm = makeVM()
        vm.goBack()
        XCTAssertEqual(vm.step, .gender)
    }

    func test_advance_fromActivity_landsOnSummary_thenSubmits() async {
        let vm = makeVM()
        // gender → height → weight → age → activity
        for _ in 0..<4 { await vm.advance() }
        XCTAssertEqual(vm.step, .activity)
        // activity -> summary
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

    func test_estimatedBMR_nonbinary_usesNeutralFormula() {
        let vm = makeVM()
        vm.gender = .nonbinary
        vm.weightKg = 70
        vm.heightCm = 170
        vm.age = 30
        // 10*70 + 6.25*170 - 5*30 - 78 = 700 + 1062.5 - 150 - 78 = 1534.5 -> 1535
        XCTAssertEqual(vm.estimatedBMR, 1535)
    }

    func test_weeklyTarget_isDailyGoalTimesSeven() {
        let vm = makeVM()
        vm.calorieGoal = 1850
        XCTAssertEqual(vm.weeklyTarget, 12_950)
    }

    func test_gender_wireValue_mapsNonbinaryToFemale() {
        XCTAssertEqual(Gender.male.wireValue, "MALE")
        XCTAssertEqual(Gender.female.wireValue, "FEMALE")
        XCTAssertEqual(Gender.nonbinary.wireValue, "FEMALE")
        XCTAssertEqual(Gender.preferNotToSay.wireValue, "FEMALE")
    }

    // MARK: - Helpers

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

    private func next(after step: OnboardingStep) -> OnboardingStep? {
        OnboardingStep(rawValue: step.rawValue + 1)
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
