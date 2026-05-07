import SwiftUI

struct KCalBadge: View {
    let kcal: Int
    var emphasized: Bool = false

    var body: some View {
        HStack(spacing: 2) {
            Text("\(kcal)")
                .font(.system(size: emphasized ? 16 : 13, weight: .bold, design: .rounded))
                .monospacedDigit()
            Text("kcal")
                .font(.system(size: emphasized ? 11 : 10, weight: .semibold, design: .rounded))
                .baselineOffset(-1)
        }
        .foregroundStyle(emphasized ? EatoColor.accentContrast : EatoColor.terracotta)
        .padding(.horizontal, emphasized ? 12 : 8)
        .padding(.vertical, emphasized ? 6 : 4)
        .background(
            emphasized ? EatoColor.terracotta : EatoColor.terracottaSoft.opacity(0.3),
            in: Capsule()
        )
    }
}

#Preview {
    HStack(spacing: 12) {
        KCalBadge(kcal: 240)
        KCalBadge(kcal: 1875, emphasized: true)
    }
    .padding()
    .background(EatoColor.background)
}
