import Foundation

enum PetHealthState: String, Decodable, Sendable {
    case thriving = "THRIVING"
    case happy = "HAPPY"
    case neutral = "NEUTRAL"
    case sad = "SAD"
    case struggling = "STRUGGLING"
}

struct PetHealthDTO: Decodable, Sendable, Equatable {
    let daysOnGoal: Int
    let healthState: PetHealthState
    let recentDays: [RecentDay]

    struct RecentDay: Decodable, Sendable, Equatable {
        let date: Date
        let goalMet: Bool
    }
}
