import Foundation

// Hand-authored Phase 0 DTOs for the /auth/me endpoint. Later phases replace
// these with swift-openapi-generator output under Core/Networking/Generated/.
struct UserDTO: Decodable, Identifiable, Sendable, Equatable {
    let id: String
    let clerkId: String
    let email: String
    let name: String?
    let profileCompleted: Bool
    let partnerId: String?
    let profile: ProfileDTO?
    let partner: PartnerSummaryDTO?
}

struct ProfileDTO: Decodable, Sendable, Equatable {
    let id: String
    let age: Int
    let weight: Double
    let height: Double
    let gender: String
    let activityLevel: String
    let bmr: Double
    let tdee: Double
    let calorieGoal: Double
}

struct PartnerSummaryDTO: Decodable, Sendable, Equatable {
    let id: String
    let name: String?
}
