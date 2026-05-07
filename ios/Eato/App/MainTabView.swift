import SwiftUI

enum MainTab: Hashable {
    case today, log, insight, friends, me
}

struct MainTabView: View {
    @Environment(DeepLinkRouter.self) private var router
    @State private var selection: MainTab = .today

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack {
                DashboardView(onCompose: { selection = .log })
            }
            .tabItem { Label("Today", systemImage: "sun.max.fill") }
            .tag(MainTab.today)

            AddFoodView()
                .tabItem { Label("Log", systemImage: "plus.circle.fill") }
                .tag(MainTab.log)

            InsightView()
                .tabItem { Label("Insight", systemImage: "chart.bar.fill") }
                .tag(MainTab.insight)

            FriendsView()
                .tabItem { Label("Friends", systemImage: "person.3.fill") }
                .tag(MainTab.friends)

            ProfileView()
                .tabItem { Label("Me", systemImage: "person.crop.circle") }
                .tag(MainTab.me)
        }
        .onChange(of: router.pendingLink) { _, link in
            guard let link else { return }
            switch link {
            case .friends, .friendCode: selection = .friends
            }
        }
    }
}
