import SwiftUI

enum InsightTab: String, CaseIterable, Identifiable {
    case weekly, history, streaks
    var id: String { rawValue }
    var label: String {
        switch self {
        case .weekly: return "Weekly"
        case .history: return "History"
        case .streaks: return "Streaks"
        }
    }
}

struct InsightView: View {
    @State private var selection: InsightTab = .weekly

    var body: some View {
        NavigationStack {
            ZStack {
                EatoColor.background.ignoresSafeArea()
                VStack(spacing: 0) {
                    segmented
                        .padding(.horizontal, Spacing.lg)
                        .padding(.top, Spacing.md)
                        .padding(.bottom, Spacing.sm)

                    Group {
                        switch selection {
                        case .weekly: WeeklyView()
                        case .history: HistoryView()
                        case .streaks: StreaksView()
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationTitle("Insight")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var segmented: some View {
        HStack(spacing: 4) {
            ForEach(InsightTab.allCases) { tab in
                Button {
                    withAnimation(.smooth(duration: 0.18)) { selection = tab }
                } label: {
                    Text(tab.label)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(
                            selection == tab ? EatoColor.accentContrast : EatoColor.textSecondary
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            selection == tab ? EatoColor.terracotta : Color.clear,
                            in: Capsule()
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(EatoColor.surface, in: Capsule())
        .softShadow(elevation: 4)
    }
}
