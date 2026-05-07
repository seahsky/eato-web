import Foundation
import Observation

@Observable
@MainActor
final class ProfileViewModel {
    private(set) var streak: StreakDataDTO?
    private(set) var settings: NotificationSettingsDTO?
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
        streak = await s
        settings = await n
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
