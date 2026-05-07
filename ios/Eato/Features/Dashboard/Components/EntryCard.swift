import SwiftUI

struct EntryCard: View {
    let entry: FoodEntryDTO
    var onTap: () -> Void = {}

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: Spacing.md) {
                photo

                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.foodName)
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                        .lineLimit(1)

                    if let serving = servingText {
                        Text(serving)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(EatoColor.textSecondary)
                            .lineLimit(1)
                    }

                    HStack(spacing: 6) {
                        KCalBadge(kcal: Int(entry.calories))
                        if let mood = mood {
                            MoodTag(mood: mood)
                        }
                    }
                    .padding(.top, 2)

                    if let note = entry.note, !note.isEmpty {
                        Text(note)
                            .font(.system(size: 12, weight: .regular, design: .rounded))
                            .foregroundStyle(EatoColor.textSecondary)
                            .italic()
                            .lineLimit(2)
                            .padding(.top, 2)
                    }
                }

                Spacer(minLength: 0)
            }
            .padding(Spacing.md)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        }
        .buttonStyle(.plain)
        .softShadow(elevation: 4)
    }

    private var mood: Mood? {
        guard let raw = entry.mood else { return nil }
        return Mood(rawValue: raw)
    }

    private var servingText: String? {
        guard let size = entry.servingSize, let unit = entry.servingUnit else { return nil }
        let formatted = size.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(size))"
            : String(format: "%.1f", size)
        return "\(formatted) \(unit)"
    }

    @ViewBuilder
    private var photo: some View {
        if let urlString = entry.imageUrl, let url = URL(string: urlString) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                default:
                    fallback
                }
            }
            .frame(width: 64, height: 64)
            .clipShape(.rect(cornerRadius: Radius.md))
        } else {
            fallback
                .frame(width: 64, height: 64)
                .clipShape(.rect(cornerRadius: Radius.md))
        }
    }

    private var fallback: some View {
        ZStack {
            EatoColor.terracottaSoft.opacity(0.4)
            Text(emojiFor(entry.foodName))
                .font(.system(size: 28))
        }
    }

    private func emojiFor(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.contains("coffee") || lower.contains("tea") { return "☕" }
        if lower.contains("salad") { return "🥗" }
        if lower.contains("pizza") { return "🍕" }
        if lower.contains("burger") { return "🍔" }
        if lower.contains("rice") { return "🍚" }
        if lower.contains("noodle") || lower.contains("pasta") { return "🍜" }
        if lower.contains("apple") { return "🍎" }
        if lower.contains("banana") { return "🍌" }
        if lower.contains("egg") { return "🥚" }
        if lower.contains("bread") || lower.contains("toast") { return "🍞" }
        if lower.contains("chocolate") { return "🍫" }
        if lower.contains("cake") || lower.contains("cookie") { return "🍪" }
        return "🍽️"
    }
}
