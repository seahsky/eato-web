import Foundation

enum PetHealthState: String, Decodable, Sendable {
    case thriving = "thriving"
    case healthy = "healthy"
    case okay = "okay"
    case struggling = "struggling"

    var emoji: String {
        switch self {
        case .thriving: "🌟"
        case .healthy: "😊"
        case .okay: "😐"
        case .struggling: "😔"
        }
    }

    var label: String {
        switch self {
        case .thriving: "Thriving"
        case .healthy: "Healthy"
        case .okay: "Okay"
        case .struggling: "Struggling"
        }
    }
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
