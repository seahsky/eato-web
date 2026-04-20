import UIKit
import SwiftUI

// The only reason this exists is so UIApplicationDelegate's push callbacks
// can hand the APNs token back to the @Observable PushNotificationsManager.
// SwiftUI's UIApplicationDelegateAdaptor keeps the rest of the app lifecycle
// on the scene-based SwiftUI App protocol.
final class EatoAppDelegate: NSObject, UIApplicationDelegate {
    static weak var pushManager: PushNotificationsManager?

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task { @MainActor in
            await Self.pushManager?.didReceive(deviceToken: deviceToken)
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        Task { @MainActor in
            Self.pushManager?.didFailToRegister(error: error)
        }
    }
}
