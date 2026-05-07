import Foundation

enum StatsAPI {
    static func daily(date: String) -> Endpoint<DailySummaryDTO> {
        .get("stats/daily", query: [URLQueryItem(name: "date", value: date)])
    }

    static var streak: Endpoint<StreakDataDTO> {
        .get("stats/streak")
    }

    static func weekly(endDate: String?) -> Endpoint<WeeklySummaryDTO> {
        var q: [URLQueryItem] = []
        if let endDate { q.append(URLQueryItem(name: "endDate", value: endDate)) }
        return .get("stats/weekly", query: q)
    }
}

enum FoodEntriesAPI {
    static func byDate(_ date: String) -> Endpoint<[FoodEntryDTO]> {
        .get("food/entries/by-date", query: [URLQueryItem(name: "date", value: date)])
    }
}

enum AchievementsAPI {
    static var getAll: Endpoint<AchievementsSummaryDTO> { .get("achievements") }
}

enum RestDayAPI {
    static var list: Endpoint<RestDayListDTO> { .get("stats/rest-days") }

    static func declare(date: String) -> Endpoint<EmptyResponse> {
        .post("stats/rest-days", body: RestDayRequest(date: date))
    }

    static func remove(date: String) -> Endpoint<EmptyResponse> {
        .init(
            method: .delete,
            path: "stats/rest-days",
            query: [URLQueryItem(name: "date", value: date)]
        )
    }
}

struct RestDayRequest: Encodable, Sendable { let date: String }

struct RestDayListDTO: Decodable, Sendable {
    let restDayDates: [Date]
    let restDaysRemaining: Int
    let needsReset: Bool
}
