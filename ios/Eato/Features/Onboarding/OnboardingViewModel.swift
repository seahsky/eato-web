import Foundation
import Observation

enum OnboardingStep: Int, CaseIterable {
    case basics
    case body
    case activity
    case goal

    var title: String {
        switch self {
        case .basics: "Tell us about you"
        case .body: "Your stats"
        case .activity: "How active are you?"
        case .goal: "Your daily goal"
        }
    }

    var progress: Double {
        Double(rawValue + 1) / Double(OnboardingStep.allCases.count)
    }
}

@Observable
@MainActor
final class OnboardingViewModel {
    var step: OnboardingStep = .basics
    var age: Int = 28
    var gender: Gender = .female
    var weightKg: Double = 65
    var heightCm: Double = 165
    var activityLevel: ActivityLevel = .moderatelyActive
    var calorieGoal: Double = 2000
    var showSuggestedGoal: Bool = true

    var suggestedGoal: Double?
    var isSaving: Bool = false
    var errorMessage: String?

    private let api: APIClient
    private let onComplete: @MainActor () async -> Void

    init(api: APIClient, onComplete: @escaping @MainActor () async -> Void) {
        self.api = api
        self.onComplete = onComplete
    }

    var canAdvance: Bool {
        switch step {
        case .basics: age >= 13 && age <= 120
        case .body: weightKg >= 20 && weightKg <= 500 && heightCm >= 50 && heightCm <= 300
        case .activity: true
        case .goal: calorieGoal >= 1000 && calorieGoal <= 10000
        }
    }

    func advance() async {
        guard canAdvance else { return }
        switch step {
        case .basics:
            step = .body
        case .body:
            step = .activity
        case .activity:
            await fetchSuggestedGoal()
            step = .goal
        case .goal:
            await submit()
        }
    }

    func goBack() {
        guard let previous = OnboardingStep(rawValue: step.rawValue - 1) else { return }
        step = previous
    }

    private func fetchSuggestedGoal() async {
        do {
            let preview = try await api.send(
                ProfileAPI.calculateBMRPreview(
                    .init(
                        age: age,
                        weight: weightKg,
                        height: heightCm,
                        gender: gender,
                        activityLevel: activityLevel
                    )
                )
            )
            suggestedGoal = preview.suggestedGoal ?? preview.tdee
            if showSuggestedGoal, let suggested = suggestedGoal {
                calorieGoal = suggested
            }
        } catch {
            // Fall back to the user-typed goal without a preview.
            suggestedGoal = nil
        }
    }

    private func submit() async {
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        do {
            _ = try await api.send(
                ProfileAPI.completeOnboarding(
                    .init(
                        age: age,
                        weight: weightKg,
                        height: heightCm,
                        gender: gender,
                        activityLevel: activityLevel,
                        calorieGoal: calorieGoal
                    )
                )
            )
            await onComplete()
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
