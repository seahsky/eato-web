import SwiftUI

enum DiaryFilter: String, CaseIterable, Identifiable {
    case all
    case breakfast = "BREAKFAST"
    case lunch = "LUNCH"
    case dinner = "DINNER"
    case snack = "SNACK"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .all: return "All"
        case .breakfast: return "Breakfast"
        case .lunch: return "Lunch"
        case .dinner: return "Dinner"
        case .snack: return "Snack"
        }
    }

    var icon: String {
        switch self {
        case .all: return "list.bullet"
        case .breakfast: return "sun.max"
        case .lunch: return "fork.knife"
        case .dinner: return "moon"
        case .snack: return "leaf"
        }
    }
}

struct QuickChips: View {
    @Binding var selection: DiaryFilter

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(DiaryFilter.allCases) { filter in
                    chip(filter)
                }
            }
            .padding(.horizontal, Spacing.lg)
        }
    }

    private func chip(_ filter: DiaryFilter) -> some View {
        let isSelected = selection == filter
        return Button {
            withAnimation(.smooth(duration: 0.2)) { selection = filter }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: filter.icon)
                    .font(.system(size: 11, weight: .semibold))
                Text(filter.label)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
            }
            .foregroundStyle(isSelected ? EatoColor.accentContrast : EatoColor.textPrimary)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(
                isSelected ? EatoColor.terracotta : EatoColor.surface,
                in: Capsule()
            )
            .softShadow(elevation: isSelected ? 6 : 2)
        }
        .buttonStyle(.plain)
    }
}
