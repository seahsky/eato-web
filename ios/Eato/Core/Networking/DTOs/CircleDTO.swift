import Foundation

// MARK: - Circle list / detail

struct CircleListItemDTO: Decodable, Sendable, Hashable, Identifiable {
    let id: String
    let name: String
    let emoji: String
    let timezone: String
    let memberCount: Int
    let role: String          // "OWNER" | "MEMBER"
    let joinedAt: Date
}

struct CircleMemberDTO: Decodable, Sendable, Equatable, Identifiable {
    var id: String { userId }
    let userId: String
    let role: String          // "OWNER" | "MEMBER"
    let joinedAt: Date
    let name: String?
    let email: String
}

struct CircleScheduleDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let label: String
    let localTime: String     // "HH:MM" 24h
    let daysOfWeek: Int       // bitmask, bit 0 = Sun ... bit 6 = Sat
    let enabled: Bool
}

struct CircleDetailDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let name: String
    let emoji: String
    let timezone: String
    let mealMomentWindowMinutes: Int
    let showEmptySlots: Bool
    let createdAt: Date
    let myRole: String
    let members: [CircleMemberDTO]
    let schedules: [CircleScheduleDTO]
}

// MARK: - Create / update

struct CreateCircleRequest: Encodable, Sendable {
    let name: String
    let emoji: String
    let timezone: String
}

struct UpdateCircleRequest: Encodable, Sendable {
    let circleId: String
    let name: String?
    let emoji: String?
    let timezone: String?
    let mealMomentWindowMinutes: Int?
    let showEmptySlots: Bool?
}

struct InviteCircleRequest: Encodable, Sendable {
    let circleId: String
    let friendUserId: String
}

struct KickCircleMemberRequest: Encodable, Sendable {
    let circleId: String
    let userId: String
}

struct LeaveCircleRequest: Encodable, Sendable {
    let circleId: String
}

struct LeaveCircleResponse: Decodable, Sendable, Equatable {
    let success: Bool
    let deleted: Bool
}

struct SetScheduleRequest: Encodable, Sendable {
    struct Item: Encodable, Sendable {
        let label: String
        let localTime: String
        let daysOfWeek: Int
    }
    let circleId: String
    let schedules: [Item]
}

struct CallMomentRequest: Encodable, Sendable {
    let circleId: String
    let label: String?
}

// MARK: - Meal moments / entries / reactions

struct MomentEntrySlotReactionDTO: Decodable, Sendable, Equatable, Hashable {
    let emoji: String
    let userId: String
}

struct MomentEntrySlotDTO: Decodable, Sendable, Hashable, Identifiable {
    let id: String
    let userId: String
    let userName: String?
    let foodEntryId: String?
    let photoUrl: String?
    let note: String?
    let mood: String?
    let loggedAtMs: Int?
    let reactions: [MomentEntrySlotReactionDTO]
}

struct MealMomentDTO: Decodable, Sendable, Hashable, Identifiable {
    let id: String
    let kind: String          // "SCHEDULED" | "ADHOC"
    let label: String
    let firedAt: Date
    let closesAt: Date
    let gridImageUrl: String?
    let triggeredByUserId: String?
    let entries: [MomentEntrySlotDTO]
}

struct MomentFeedResponse: Decodable, Sendable, Equatable {
    let items: [MealMomentDTO]
    let nextCursor: String?
}

struct DayCardDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let circleId: String
    let date: Date
    let imageUrl: String
    let momentIds: [String]
    let generatedAt: Date
}

// MARK: - Submit moment

struct MomentSubmitEntry: Encodable, Sendable {
    let name: String
    let brand: String?
    let imageUrl: String?
    let calories: Double
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let fiber: Double?
    let sugar: Double?
    let sodium: Double?
    let servingSize: Double
    let servingUnit: String
    let mood: String?
    let note: String?
    let isManualEntry: Bool
    let dataSource: String   // "FATSECRET" | "MANUAL" | "OPEN_FOOD_FACTS" | "USDA"
    let fatSecretId: String?
}

struct SubmitMomentRequest: Encodable, Sendable {
    let momentId: String
    let entry: MomentSubmitEntry
}

struct ReactRequest: Encodable, Sendable {
    let entryId: String
    let emoji: String
}

struct ReactResponse: Decodable, Sendable, Equatable {
    let active: Bool
}
