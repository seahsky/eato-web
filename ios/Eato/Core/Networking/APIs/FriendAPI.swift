import Foundation

// tRPC-over-REST endpoints that take no body still need a JSON `{}` sent
// for POST-with-input procedures; this empty struct encodes to `{}`.
struct EmptyBody: Encodable, Sendable {}

enum FriendAPI {
    static var generateCode: Endpoint<FriendCodeDTO> {
        .post("friends/code", body: EmptyBody())
    }

    static func accept(code: String) -> Endpoint<AcceptFriendCodeResponse> {
        .post("friends/accept", body: AcceptFriendCodeRequest(code: code))
    }

    static func remove(friendId: String) -> Endpoint<RemoveFriendResponse> {
        .post("friends/remove", body: RemoveFriendRequest(friendId: friendId))
    }

    static var list: Endpoint<[FriendDTO]> {
        .get("friends")
    }

    static func feed(cursor: String?, limit: Int = 20) -> Endpoint<FriendFeedResponse> {
        var q: [URLQueryItem] = [URLQueryItem(name: "limit", value: String(limit))]
        if let cursor { q.append(URLQueryItem(name: "cursor", value: cursor)) }
        return .get("friends/feed", query: q)
    }
}
