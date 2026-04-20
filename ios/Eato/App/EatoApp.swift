import SwiftUI
import Clerk

@main
struct EatoApp: App {
    @UIApplicationDelegateAdaptor(EatoAppDelegate.self) private var appDelegate
    @State private var session = SessionStore()
    @State private var pushManager: PushNotificationsManager?

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .task {
                    Clerk.shared.configure(publishableKey: AppConfig.clerkPublishableKey)
                    await session.bootstrap()
                    let manager = PushNotificationsManager(api: session.api)
                    EatoAppDelegate.pushManager = manager
                    pushManager = manager
                    await manager.bootstrap()
                }
        }
    }
}
