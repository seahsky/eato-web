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
