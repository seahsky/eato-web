import Foundation

enum StatsAPI {
    static func daily(date: String) -> Endpoint<DailySummaryDTO> {
        .get("stats/daily", query: [URLQueryItem(name: "date", value: date)])
    }

    static var streak: Endpoint<StreakDataDTO> {
        .get("stats/streak")
    }
}

enum AchievementsAPI {
    static var getAll: Endpoint<AchievementsSummaryDTO> { .get("achievements") }
}

enum PetAPI {
    static var getHealth: Endpoint<PetHealthDTO> { .get("pet/health") }
}
