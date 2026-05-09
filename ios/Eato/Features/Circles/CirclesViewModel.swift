import Foundation
import Observation

@Observable
@MainActor
final class CirclesViewModel {
    enum LoadState: Equatable {
        case idle, loading, loaded, failed(APIError)
    }

    private(set) var listState: LoadState = .idle
    private(set) var circles: [CircleListItemDTO] = []
    private(set) var lastError: String?
    var isWorking: Bool = false

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func loadCircles() async {
        listState = .loading
        do {
            circles = try await api.send(CircleAPI.list)
            listState = .loaded
        } catch let apiError as APIError {
            listState = .failed(apiError)
        } catch {
            listState = .failed(.server(message: error.localizedDescription))
        }
    }

    func createCircle(name: String, emoji: String, timezone: String) async -> CircleListItemDTO? {
        isWorking = true
        defer { isWorking = false }
        lastError = nil
        do {
            let created = try await api.send(
                CircleAPI.create(.init(name: name, emoji: emoji, timezone: timezone))
            )
            // Server response is a thin row — refetch the list to pick up
            // the membership row + accurate count.
            await loadCircles()
            return created
        } catch let apiError as APIError {
            lastError = apiError.errorDescription ?? "Couldn't create that circle"
        } catch {
            lastError = error.localizedDescription
        }
        return nil
    }
}

@Observable
@MainActor
final class CircleDetailViewModel {
    enum LoadState: Equatable {
        case idle, loading, loaded, failed(APIError)
    }

    let circleId: String

    private(set) var detail: CircleDetailDTO?
    private(set) var detailState: LoadState = .idle

    private(set) var moments: [MealMomentDTO] = []
    private(set) var feedState: LoadState = .idle
    private(set) var feedCursor: String?
    private(set) var feedHasMore: Bool = false

    var lastError: String?
    var isWorking: Bool = false

    private let api: APIClient

    init(api: APIClient, circleId: String) {
        self.api = api
        self.circleId = circleId
    }

    func refreshAll() async {
        async let detailTask: Void = loadDetail()
        async let feedTask: Void = loadFeed(reset: true)
        _ = await (detailTask, feedTask)
    }

    func loadDetail() async {
        detailState = .loading
        do {
            detail = try await api.send(CircleAPI.get(circleId: circleId))
            detailState = .loaded
        } catch let apiError as APIError {
            detailState = .failed(apiError)
        } catch {
            detailState = .failed(.server(message: error.localizedDescription))
        }
    }

    func loadFeed(reset: Bool) async {
        if reset {
            moments = []
            feedCursor = nil
            feedHasMore = false
        }
        feedState = .loading
        do {
            let resp = try await api.send(MealMomentAPI.feed(circleId: circleId, cursor: feedCursor))
            moments.append(contentsOf: resp.items)
            feedCursor = resp.nextCursor
            feedHasMore = resp.nextCursor != nil
            feedState = .loaded
        } catch let apiError as APIError {
            feedState = .failed(apiError)
        } catch {
            feedState = .failed(.server(message: error.localizedDescription))
        }
    }

    func invite(friendUserId: String) async -> Bool {
        isWorking = true
        defer { isWorking = false }
        lastError = nil
        do {
            _ = try await api.send(CircleAPI.invite(.init(circleId: circleId, friendUserId: friendUserId)))
            await loadDetail()
            return true
        } catch let apiError as APIError {
            lastError = apiError.errorDescription
            return false
        } catch {
            lastError = error.localizedDescription
            return false
        }
    }

    func kick(userId: String) async {
        isWorking = true
        defer { isWorking = false }
        do {
            _ = try await api.send(CircleAPI.kick(.init(circleId: circleId, userId: userId)))
            await loadDetail()
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func leave() async -> Bool {
        isWorking = true
        defer { isWorking = false }
        do {
            _ = try await api.send(CircleAPI.leave(.init(circleId: circleId)))
            return true
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
            return false
        }
    }

    func deleteCircle() async -> Bool {
        isWorking = true
        defer { isWorking = false }
        do {
            _ = try await api.send(CircleAPI.delete(circleId: circleId))
            return true
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
            return false
        }
    }

    func setSchedule(_ items: [SetScheduleRequest.Item]) async {
        isWorking = true
        defer { isWorking = false }
        lastError = nil
        do {
            _ = try await api.send(CircleAPI.setSchedule(.init(circleId: circleId, schedules: items)))
            await loadDetail()
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func callMoment(label: String?) async -> MealMomentDTO? {
        isWorking = true
        defer { isWorking = false }
        lastError = nil
        do {
            let moment = try await api.send(CircleAPI.callMoment(.init(circleId: circleId, label: label)))
            await loadFeed(reset: true)
            return moment
        } catch let apiError as APIError {
            lastError = apiError.errorDescription ?? "Couldn't call a moment right now"
        } catch {
            lastError = error.localizedDescription
        }
        return nil
    }

    func toggleReaction(entryId: String, emoji: String) async {
        do {
            _ = try await api.send(MealMomentAPI.react(.init(entryId: entryId, emoji: emoji)))
            // Optimistic local update — refetch the feed lazily.
            await loadFeed(reset: true)
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}
