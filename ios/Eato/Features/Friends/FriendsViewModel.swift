import Foundation
import Observation

@Observable
@MainActor
final class FriendsViewModel {
    enum LoadState: Equatable {
        case idle, loading, loaded, failed(APIError)
    }

    private(set) var listState: LoadState = .idle
    private(set) var feedState: LoadState = .idle

    private(set) var friends: [FriendDTO] = []
    private(set) var feed: [FriendFeedItemDTO] = []
    private(set) var feedCursor: String?
    private(set) var feedHasMore: Bool = false

    private(set) var myCode: FriendCodeDTO?
    private(set) var lastError: String?

    var acceptCodeInput: String = ""
    var isWorking: Bool = false

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func refreshAll() async {
        async let listTask: Void = loadFriends()
        async let feedTask: Void = loadFeed(reset: true)
        _ = await (listTask, feedTask)
    }

    func loadFriends() async {
        listState = .loading
        do {
            friends = try await api.send(FriendAPI.list)
            listState = .loaded
        } catch let apiError as APIError {
            listState = .failed(apiError)
        } catch {
            listState = .failed(.server(message: error.localizedDescription))
        }
    }

    func loadFeed(reset: Bool) async {
        if reset {
            feed = []
            feedCursor = nil
            feedHasMore = false
        }
        feedState = .loading
        do {
            let resp = try await api.send(FriendAPI.feed(cursor: feedCursor))
            feed.append(contentsOf: resp.items)
            feedCursor = resp.nextCursor
            feedHasMore = resp.nextCursor != nil
            feedState = .loaded
        } catch let apiError as APIError {
            feedState = .failed(apiError)
        } catch {
            feedState = .failed(.server(message: error.localizedDescription))
        }
    }

    func generateMyCode() async {
        isWorking = true
        defer { isWorking = false }
        lastError = nil
        do {
            myCode = try await api.send(FriendAPI.generateCode)
        } catch let apiError as APIError {
            lastError = apiError.errorDescription ?? "Failed to generate code"
        } catch {
            lastError = error.localizedDescription
        }
    }

    func acceptCode() async -> String? {
        let trimmed = acceptCodeInput.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard trimmed.count == 6 else {
            lastError = "Friend codes are 6 characters."
            return nil
        }
        isWorking = true
        defer { isWorking = false }
        lastError = nil
        do {
            let resp = try await api.send(FriendAPI.accept(code: trimmed))
            acceptCodeInput = ""
            await loadFriends()
            return resp.friendName
        } catch let apiError as APIError {
            lastError = apiError.errorDescription ?? "Couldn't accept that code"
        } catch {
            lastError = error.localizedDescription
        }
        return nil
    }

    func remove(friend: FriendDTO) async {
        isWorking = true
        defer { isWorking = false }
        do {
            _ = try await api.send(FriendAPI.remove(friendId: friend.id))
            friends.removeAll { $0.id == friend.id }
            feed.removeAll { $0.userId == friend.id }
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}
