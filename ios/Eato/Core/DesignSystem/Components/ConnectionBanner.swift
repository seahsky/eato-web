import SwiftUI

struct ConnectionBanner: View {
    let isOffline: Bool

    var body: some View {
        if isOffline {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "wifi.slash")
                Text("No connection").font(Typography.caption)
            }
            .padding(.vertical, Spacing.sm)
            .padding(.horizontal, Spacing.lg)
            .frame(maxWidth: .infinity)
            .background(EatoColor.warning)
            .foregroundStyle(.white)
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}
