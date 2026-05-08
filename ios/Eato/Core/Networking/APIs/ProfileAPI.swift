import Foundation

enum Gender: String, Codable, CaseIterable, Sendable {
    case male = "MALE"
    case female = "FEMALE"

    var label: String {
        switch self {
        case .male: "Male"
        case .female: "Female"
        }
    }
}

enum ActivityLevel: String, Codable, CaseIterable, Sendable {
    case sedentary = "SEDENTARY"
    case lightlyActive = "LIGHTLY_ACTIVE"
    case moderatelyActive = "MODERATELY_ACTIVE"
    case active = "ACTIVE"
    case veryActive = "VERY_ACTIVE"

    var label: String {
        switch self {
        case .sedentary: "Sedentary"
        case .lightlyActive: "Lightly active"
        case .moderatelyActive: "Moderately active"
        case .active: "Active"
        case .veryActive: "Very active"
        }
    }

    var hint: String {
        switch self {
        case .sedentary: "Little or no exercise"
        case .lightlyActive: "1–3 days/week of light exercise"
        case .moderatelyActive: "3–5 days/week of moderate exercise"
        case .active: "6–7 days/week of exercise"
        case .veryActive: "Hard daily training or physical job"
        }
    }
}

struct CompleteOnboardingRequest: Encodable, Sendable {
    let age: Int
    let weight: Double
    let height: Double
    let gender: Gender
    let activityLevel: ActivityLevel
    let calorieGoal: Double
}

struct CalculateBMRRequest: Encodable, Sendable {
    let age: Int
    let weight: Double
    let height: Double
    let gender: Gender
    let activityLevel: ActivityLevel
}

struct BMRPreviewDTO: Decodable, Sendable {
    let bmr: Double
    let tdee: Double
    let suggestedGoal: Double?
}

struct UpdateGoalRequest: Encodable, Sendable {
    let calorieGoal: Double
}

/// Full-profile upsert body — matches the backend's `profileSchema`.
/// `calorieGoal` is optional so changing only the activity level still
/// triggers a server-side recompute of BMR/TDEE/calorieGoal.
struct UpsertProfileRequest: Encodable, Sendable {
    let age: Int
    let weight: Double
    let height: Double
    let gender: Gender
    let activityLevel: ActivityLevel
    let calorieGoal: Double?
}

enum ProfileAPI {
    static var get: Endpoint<ProfileDTO?> { .get("profile") }

    static func completeOnboarding(_ body: CompleteOnboardingRequest) -> Endpoint<CompleteOnboardingResponse> {
        .post("profile/complete-onboarding", body: body)
    }

    static func calculateBMRPreview(_ body: CalculateBMRRequest) -> Endpoint<BMRPreviewDTO> {
        .post("profile/calculate-bmr-preview", body: body)
    }

    static func updateGoal(_ body: UpdateGoalRequest) -> Endpoint<ProfileDTO> {
        .put("profile/goal", body: body)
    }

    static func upsert(_ body: UpsertProfileRequest) -> Endpoint<ProfileDTO> {
        .put("profile", body: body)
    }
}
