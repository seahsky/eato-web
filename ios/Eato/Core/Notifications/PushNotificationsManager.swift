import Foundation
import UIKit
import UserNotifications
import Observation

// Wraps UIApplication + UNUserNotificationCenter. Owns the device-id lifecycle
// (stable per-install UUID kept in UserDefaults) and pushes the APNs token up
// to the backend via NotificationAPI.registerIosDevice.
@Observable
@MainActor
final class PushNotificationsManager: NSObject {
    enum Status: Equatable {
        case notDetermined
        case denied
        case authorized(token: String?)
    }

    private(set) var status: Status = .notDetermined

    private let api: APIClient
    private let defaults: UserDefaults

    init(api: APIClient, defaults: UserDefaults = .standard) {
        self.api = api
        self.defaults = defaults
        super.init()
    }

    /// Called from EatoApp once SessionStore has transitioned to .signedIn.
    func bootstrap() async {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            status = .authorized(token: storedToken)
            await UIApplication.shared.registerForRemoteNotifications()
        case .denied:
            status = .denied
        default:
            status = .notDetermined
        }
    }

    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound, .providesAppNotificationSettings])
            if granted {
                status = .authorized(token: storedToken)
                await UIApplication.shared.registerForRemoteNotifications()
            } else {
                status = .denied
            }
        } catch {
            status = .denied
        }
    }

    /// UIApplicationDelegate hands off the raw device token here.
    func didReceive(deviceToken: Data) async {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        defaults.set(hex, forKey: Keys.token)
        status = .authorized(token: hex)
        await syncToBackend(token: hex)
    }

    func didFailToRegister(error: Error) {
        // eslint-esque lint: keep the user in .notDetermined so the UI can prompt again.
        status = .notDetermined
    }

    func signedOut() async {
        guard let deviceId = deviceId, storedToken != nil else { return }
        _ = try? await api.send(NotificationAPI.unregisterIosDevice(.init(deviceId: deviceId)))
        defaults.removeObject(forKey: Keys.token)
        status = .notDetermined
    }

    private func syncToBackend(token: String) async {
        guard let deviceId = deviceId else { return }
        let appVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        _ = try? await api.send(
            NotificationAPI.registerIosDevice(.init(
                apnToken: token,
                deviceId: deviceId,
                appVersion: appVersion
            ))
        )
    }

    private var storedToken: String? {
        defaults.string(forKey: Keys.token)
    }

    private var deviceId: String? {
        if let existing = defaults.string(forKey: Keys.deviceId) { return existing }
        let generated = UUID().uuidString
        defaults.set(generated, forKey: Keys.deviceId)
        return generated
    }

    private enum Keys {
        static let token = "eato.apns.token"
        static let deviceId = "eato.apns.deviceId"
    }
}

extension PushNotificationsManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .badge, .sound]
    }
}
