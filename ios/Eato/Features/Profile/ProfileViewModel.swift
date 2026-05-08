import Foundation
import Observation

@Observable
@MainActor
final class ProfileViewModel {
    private(set) var streak: StreakDataDTO?
    private(set) var settings: NotificationSettingsDTO?
    private(set) var friendCount: Int = 0
    private(set) var lastError: String?
    var isSaving: Bool = false

    private let api: APIClient
    private let onProfileChanged: @MainActor () async -> Void

    init(api: APIClient, onProfileChanged: @escaping @MainActor () async -> Void) {
        self.api = api
        self.onProfileChanged = onProfileChanged
    }

    func load() async {
        async let s: StreakDataDTO? = try? api.send(StatsAPI.streak)
        async let n: NotificationSettingsDTO? = try? api.send(NotificationAPI.getSettings)
        async let friends: [FriendDTO]? = try? api.send(FriendAPI.list)
        streak = await s
        settings = await n
        friendCount = (await friends)?.count ?? 0
    }

    func updateGoal(_ kcal: Double) async {
        isSaving = true
        defer { isSaving = false }
        do {
            _ = try await api.send(ProfileAPI.updateGoal(.init(calorieGoal: kcal)))
            await onProfileChanged()
        } catch let e as APIError {
            lastError = e.errorDescription
        } catch {
            lastError = error.localizedDescription
        }
    }

    /// Re-runs profile.upsert with the new activity level so BMR/TDEE/calorieGoal
    /// recompute on the backend. Caller supplies the current physical metrics
    /// from the session's user so we don't re-prompt or store them locally.
    func updateActivityLevel(
        _ level: ActivityLevel,
        currentProfile profile: ProfileDTO
    ) async {
        guard let gender = Gender(rawValue: profile.gender) else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            _ = try await api.send(
                ProfileAPI.upsert(
                    .init(
                        age: profile.age,
                        weight: profile.weight,
                        height: profile.height,
                        gender: gender,
                        activityLevel: level,
                        calorieGoal: nil
                    )
                )
            )
            await onProfileChanged()
        } catch let e as APIError {
            lastError = e.errorDescription
        } catch {
            lastError = error.localizedDescription
        }
    }

    func toggle(_ keyPath: WritableKeyPath<NotificationSettingsDTO, Bool>, to value: Bool) async {
        guard var current = settings else { return }
        current[keyPath: keyPath] = value
        settings = current

        let body = UpdateNotificationSettingsRequest(
            friendFoodLogged: keyPath == \NotificationSettingsDTO.friendFoodLogged ? value : nil,
            friendGoalReached: keyPath == \NotificationSettingsDTO.friendGoalReached ? value : nil,
            friendAdded: keyPath == \NotificationSettingsDTO.friendAdded ? value : nil,
            receiveNudges: keyPath == \NotificationSettingsDTO.receiveNudges ? value : nil,
            timezone: nil
        )
        do {
            settings = try await api.send(NotificationAPI.updateSettings(body))
        } catch let e as APIError {
            lastError = e.errorDescription
        } catch {
            lastError = error.localizedDescription
        }
    }
}
