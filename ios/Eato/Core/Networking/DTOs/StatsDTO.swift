import Foundation

struct DailySummaryDTO: Decodable, Sendable, Equatable {
    let date: Date
    let totalCalories: Double
    let totalProtein: Double
    let totalCarbs: Double
    let totalFat: Double
    let totalFiber: Double
    let calorieGoal: Double
    let bmr: Double?
    let tdee: Double?
    let entries: [FoodEntryDTO]
}

struct CompleteOnboardingResponse: Decodable, Sendable {
    let profile: ProfileDTO
    let bmr: Double
    let tdee: Double
}

struct StreakDataDTO: Decodable, Sendable, Equatable {
    let currentStreak: Int
    let longestStreak: Int
    let goalStreak: Int
    let longestGoalStreak: Int
    let streakFreezes: Int
    let flameSize: String
    let nextMilestone: Int
    let milestoneProgress: Int
    let streakAtRisk: Bool
    let weeklyStreak: Int
    let longestWeeklyStreak: Int
    let currentWeekDays: Int
    let weeklyProgress: Int
    let nextWeeklyMilestone: Int
}
