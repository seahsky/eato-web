import Foundation

struct PartnerCodeDTO: Decodable, Sendable, Equatable {
    let code: String
    let expiresAt: Date
}

struct LinkPartnerResponse: Decodable, Sendable, Equatable {
    let success: Bool
    let partnerName: String?
}

struct UnlinkPartnerResponse: Decodable, Sendable, Equatable {
    let success: Bool
}

struct LinkPartnerRequest: Encodable, Sendable {
    let code: String
}

// Pending approval row — the backend spreads a full FoodEntry and adds
// `loggedByName`. We Decode a partial set of fields; unknown ones drop.
struct PendingEntryDTO: Decodable, Sendable, Identifiable, Equatable {
    let id: String
    let foodName: String
    let brandName: String?
    let calories: Double
    let protein: Double?
    let carbs: Double?
    let fat: Double?
    let consumedAt: Date
    let loggedByUserId: String?
    let loggedByName: String?
    let approvalStatus: String
    let rejectionNote: String?
}

struct ApproveResponse: Decodable, Sendable { let success: Bool }

struct RejectRequest: Encodable, Sendable {
    let note: String?
}
