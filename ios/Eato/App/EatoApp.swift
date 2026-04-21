import SwiftUI
import Clerk

@main
struct EatoApp: App {
    @UIApplicationDelegateAdaptor(EatoAppDelegate.self) private var appDelegate
    @State private var session = SessionStore()
    @State private var pushManager: PushNotificationsManager?
    @State private var router = DeepLinkRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .environment(router)
                .onOpenURL { router.handle($0) }
                .task {
                    Clerk.shared.configure(publishableKey: AppConfig.clerkPublishableKey)
                    await session.bootstrap()
                    let manager = PushNotificationsManager(api: session.api, router: router)
                    EatoAppDelegate.pushManager = manager
                    pushManager = manager
                    await manager.bootstrap()
                }
        }
    }
}
