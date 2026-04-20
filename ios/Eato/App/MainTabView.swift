import SwiftUI

enum MainTab: Hashable {
    case today, log, week, partner, me
}

struct MainTabView: View {
    @State private var selection: MainTab = .today

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack { DashboardView() }
                .tabItem { Label("Today", systemImage: "sun.max.fill") }
                .tag(MainTab.today)

            LogHomeView()
                .tabItem { Label("Log", systemImage: "plus.circle.fill") }
                .tag(MainTab.log)

            WeekView()
                .tabItem { Label("Week", systemImage: "calendar") }
                .tag(MainTab.week)

            PartnerHomeView()
                .tabItem { Label("Partner", systemImage: "person.2.fill") }
                .tag(MainTab.partner)

            NavigationStack { ProfileTabView() }
                .tabItem { Label("Me", systemImage: "person.crop.circle") }
                .tag(MainTab.me)
        }
    }
}

// Stubs — later phases replace each one.
struct TabPlaceholderView: View {
    let tab: MainTab

    var body: some View {
        EmptyState(
            systemImage: "hammer",
            title: title,
            message: message
        )
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var title: String {
        switch tab {
        case .today: "Today"
        case .log: "Log"
        case .week: "Week"
        case .partner: "Partner"
        case .me: "Me"
        }
    }

    private var message: String {
        switch tab {
        case .log: "Food search, barcode, and photo logging land in Phase 2."
        case .week: "Week view ships in Phase 3."
        case .partner: "Partner link + approvals arrive in Phase 5."
        case .me: "Account settings arrive in Phase 6."
        default: ""
        }
    }
}

private struct ProfileTabView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        VStack(spacing: Spacing.lg) {
            if let user = session.currentUser {
                Text(user.email).font(Typography.titleSmall)
                if let profile = user.profile {
                    Text("Daily goal: \(Int(profile.calorieGoal)) kcal")
                        .foregroundStyle(EatoColor.textSecondary)
                        .font(Typography.bodyMedium)
                }
            }
            PrimaryButton("Sign out") {
                Task { await session.signOut() }
            }
            Spacer()
        }
        .padding(Spacing.lg)
        .navigationTitle("Me")
        .navigationBarTitleDisplayMode(.inline)
    }
}
