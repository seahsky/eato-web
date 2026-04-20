import Foundation

struct WeeklySummaryDTO: Decodable, Sendable, Equatable {
    struct Day: Decodable, Sendable, Equatable, Identifiable {
        let date: Date
        let totalCalories: Double
        let totalProtein: Double
        let totalCarbs: Double
        let totalFat: Double
        let calorieGoal: Double
        let goalMet: Bool

        var id: Date { date }
    }

    let days: [Day]
    let averageCalories: Int
    let totalCalories: Double
    let daysOnGoal: Int
    let calorieGoal: Double
}
