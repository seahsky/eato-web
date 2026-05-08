import Foundation
import Observation

/// 6-step onboarding flow per design `profile.jsx:155-162`.
/// One field per step; the daily calorie goal is computed from
/// BMR + activity and shown on the summary, not edited mid-flow.
enum OnboardingStep: Int, CaseIterable {
    case gender
    case height
    case weight
    case age
    case activity
    case summary

    var title: String {
        switch self {
        case .gender: "Let's get to know you"
        case .height: "How tall are you?"
        case .weight: "And weight?"
        case .age: "When were you born?"
        case .activity: "How active are you?"
        case .summary: "You're all set"
        }
    }

    var subtitle: String {
        switch self {
        case .gender: "This helps us figure out your calorie needs."
        case .height: "We promise not to judge."
        case .weight: "Just a starting point — it's your baseline, not a grade."
        case .age: "Your metabolism uses this."
        case .activity: "Be honest — not aspirational."
        case .summary: "Here's what we figured out."
        }
    }

    var progress: Double {
        Double(rawValue + 1) / Double(OnboardingStep.allCases.count)
    }
}

@Observable
@MainActor
final class OnboardingViewModel {
    var step: OnboardingStep = .gender
    var age: Int = 28
    var gender: Gender = .female
    var weightKg: Double = 65
    var heightCm: Double = 165
    var activityLevel: ActivityLevel = .moderatelyActive
    var calorieGoal: Double = 2000

    var suggestedGoal: Double?
    var isSaving: Bool = false
    var errorMessage: String?

    private let api: APIClient
    private let onComplete: @MainActor () async -> Void

    init(
        api: APIClient,
        prefill: ProfileDTO? = nil,
        onComplete: @escaping @MainActor () async -> Void
    ) {
        self.api = api
        self.onComplete = onComplete

        // Pre-fill from existing profile so users migrating from the legacy
        // app glide through onboarding instead of re-entering everything.
        if let p = prefill {
            self.age = p.age
            self.gender = Gender(rawValue: p.gender) ?? .female
            self.weightKg = p.weight
            self.heightCm = p.height
            self.activityLevel = ActivityLevel(rawValue: p.activityLevel) ?? .moderatelyActive
            self.calorieGoal = p.calorieGoal
            self.suggestedGoal = p.calorieGoal
        }
    }

    var canAdvance: Bool {
        switch step {
        case .gender: true
        case .height: heightCm >= 120 && heightCm <= 220
        case .weight: weightKg >= 35 && weightKg <= 160
        case .age: age >= 14 && age <= 90
        case .activity: true
        case .summary: true
        }
    }

    func advance() async {
        guard canAdvance else { return }
        switch step {
        case .gender:
            step = .height
        case .height:
            step = .weight
        case .weight:
            step = .age
        case .age:
            step = .activity
        case .activity:
            await fetchSuggestedGoal()
            step = .summary
        case .summary:
            await submit()
        }
    }

    /// Computed weekly target for the Summary step — `dailyBudget * 7`.
    /// Returns 0 when no goal has been computed yet.
    var weeklyTarget: Int {
        Int(calorieGoal * 7)
    }

    /// BMR estimate for the Summary step. Mirrors the backend Mifflin-St Jeor
    /// formula — kept here so we can show a number before the user submits.
    /// For non-binary or "rather not say", uses the midpoint of the male
    /// and female formulas (5 + (-161))/2 = -78.
    var estimatedBMR: Int {
        let base: Double
        switch gender {
        case .male:
            base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age) + 5
        case .female:
            base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age) - 161
        case .nonbinary, .preferNotToSay:
            base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age) - 78
        }
        return Int(base.rounded())
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
            if let suggested = suggestedGoal {
                calorieGoal = suggested
            }
        } catch {
            // Fall back to a local estimate so the summary still shows
            // something reasonable even when the preview endpoint fails.
            let multiplier: Double
            switch activityLevel {
            case .sedentary: multiplier = 1.2
            case .lightlyActive: multiplier = 1.375
            case .moderatelyActive: multiplier = 1.55
            case .active: multiplier = 1.725
            case .veryActive: multiplier = 1.9
            }
            let estimate = Double(estimatedBMR) * multiplier
            suggestedGoal = estimate
            calorieGoal = estimate
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
