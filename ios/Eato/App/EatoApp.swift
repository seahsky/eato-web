import SwiftUI
import Clerk

@main
struct EatoApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .task {
                    Clerk.shared.configure(publishableKey: AppConfig.clerkPublishableKey)
                    await session.bootstrap()
                }
        }
    }
}
