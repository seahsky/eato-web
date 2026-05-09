import SwiftUI

/// Top-level tabs after onboarding. Mirrors the design "Set C" 4-tab
/// structure (open book / calendar / sparkles / profile circle). Add
/// is no longer a tab — see `DashboardView`'s `AddCard` which now
/// presents `AddFoodView` as a full-screen sheet.
enum MainTab: Hashable {
    case today, insight, friends, me
}

struct MainTabView: View {
    @Environment(DeepLinkRouter.self) private var router
    @State private var selection: MainTab = .today

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack {
                DashboardView()
            }
            .tabItem { Label("Today", systemImage: "book.closed.fill") }
            .tag(MainTab.today)

            InsightView()
                .tabItem { Label("Week", systemImage: "calendar") }
                .tag(MainTab.insight)

            FriendsView()
                .tabItem { Label("Friends", systemImage: "sparkles") }
                .tag(MainTab.friends)

            ProfileView()
                .tabItem { Label("Me", systemImage: "person.crop.circle.fill") }
                .tag(MainTab.me)
        }
        .onChange(of: router.pendingLink) { _, link in
            guard let link else { return }
            switch link {
            case .friends, .friendCode, .circle, .circleMoment:
                selection = .friends
            }
        }
    }
}
