import SwiftUI

struct PartnerHomeView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        NavigationStack {
            Group {
                if session.currentUser?.partnerId != nil {
                    PartnerDashboardView()
                } else {
                    PartnerLinkView()
                }
            }
            .navigationTitle("Partner")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
