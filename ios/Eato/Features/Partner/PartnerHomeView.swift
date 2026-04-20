import SwiftUI

struct PartnerHomeView: View {
    @Environment(SessionStore.self) private var session
    @Environment(DeepLinkRouter.self) private var router
    @State private var navigationPath: [PartnerRoute] = []

    var body: some View {
        NavigationStack(path: $navigationPath) {
            Group {
                if session.currentUser?.partnerId != nil {
                    PartnerDashboardView()
                } else {
                    PartnerLinkView()
                }
            }
            .navigationTitle("Partner")
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: PartnerRoute.self) { route in
                switch route {
                case .approvals: PendingApprovalsView()
                }
            }
        }
        .onChange(of: router.pendingLink) { _, link in
            guard case .approve = link else { return }
            _ = router.consume()
            navigationPath = [.approvals]
        }
    }
}

enum PartnerRoute: Hashable { case approvals }
