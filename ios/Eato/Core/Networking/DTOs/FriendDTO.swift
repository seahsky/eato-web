import Foundation

struct FriendCodeDTO: Decodable, Sendable, Equatable {
    let code: String
    let expiresAt: Date
}

struct AcceptFriendCodeResponse: Decodable, Sendable, Equatable {
    let success: Bool
    let friendName: String?
}

struct RemoveFriendResponse: Decodable, Sendable, Equatable {
    let success: Bool
}

struct FriendDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let name: String?
    let email: String
    let friendedAt: Date
}

struct FriendFeedItemDTO: Decodable, Sendable, Equatable, Identifiable {
    let id: String
    let userId: String
    let userName: String?
    let name: String
    let imageUrl: String?
    let calories: Double
    let mealType: String?
    let mood: String?
    let note: String?
    let consumedAt: Date
}

struct FriendFeedResponse: Decodable, Sendable, Equatable {
    let items: [FriendFeedItemDTO]
    let nextCursor: String?
}

struct AcceptFriendCodeRequest: Encodable, Sendable {
    let code: String
}

struct RemoveFriendRequest: Encodable, Sendable {
    let friendId: String
}
