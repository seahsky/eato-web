import Foundation

struct UserDTO: Decodable, Identifiable, Sendable, Equatable {
    let id: String
    let clerkId: String
    let email: String
    let name: String?
    let profileCompleted: Bool
    let profile: ProfileDTO?
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
