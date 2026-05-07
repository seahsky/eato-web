import SwiftUI

enum Mood: String, CaseIterable, Identifiable {
    case great, good, meh, off

    var id: String { rawValue }

    var emoji: String {
        switch self {
        case .great: return "🤩"
        case .good: return "🙂"
        case .meh: return "😐"
        case .off: return "🥲"
        }
    }

    var label: String {
        switch self {
        case .great: return "Great"
        case .good: return "Good"
        case .meh: return "Meh"
        case .off: return "Off"
        }
    }

    var tint: Color {
        switch self {
        case .great: return EatoColor.sage
        case .good: return EatoColor.terracotta
        case .meh: return EatoColor.warning
        case .off: return EatoColor.textSecondary
        }
    }
}

struct MoodTag: View {
    let mood: Mood

    var body: some View {
        HStack(spacing: 4) {
            Text(mood.emoji)
            Text(mood.label)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
        }
        .foregroundStyle(mood.tint)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(mood.tint.opacity(0.12), in: Capsule())
    }
}

#Preview {
    HStack(spacing: 8) {
        ForEach(Mood.allCases) { MoodTag(mood: $0) }
    }
    .padding()
    .background(EatoColor.background)
}
