import SwiftUI

/// Photo-front card in the 3-col grid. 170dp tall, slight rotation by index.
/// Tapping opens the postcard flip overlay. Wrapped in `matchedGeometryEffect`
/// so the overlay can spring out from this card's frame.
struct StackCard: View {
    let entry: FoodEntryDTO
    /// Index in the visible grid — determines tilt seed.
    let index: Int
    let namespace: Namespace.ID
    /// Hide while the postcard overlay is in-flight from this card.
    var hidden: Bool = false
    var onTap: () -> Void

    /// `((idx * 37) % 5 - 2) * 0.25°` per the design (`dashboard.jsx:330`).
    private var tilt: Double {
        let s = (index * 37) % 5 - 2
        return Double(s) * 0.25
    }

    var body: some View {
        Button(action: onTap) {
            CardFront(entry: entry)
                .frame(height: 170)
                .frame(maxWidth: .infinity)
                .clipShape(.rect(cornerRadius: 14))
                .shadow(color: EatoColor.darkBrown.opacity(0.16), radius: 7, x: 0, y: 4)
                .shadow(color: EatoColor.darkBrown.opacity(0.08), radius: 1.5, x: 0, y: 1)
                .rotationEffect(.degrees(tilt))
                .opacity(hidden ? 0 : 1)
                .matchedGeometryEffect(id: entry.id, in: namespace, isSource: !hidden)
        }
        .buttonStyle(.plain)
    }
}

/// The image + scrim + overlay text. Reused for the postcard's front face.
struct CardFront: View {
    let entry: FoodEntryDTO

    var body: some View {
        ZStack(alignment: .topLeading) {
            photo
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Bottom-up scrim so the kcal stays readable on bright photos.
            LinearGradient(
                colors: [.clear, .black.opacity(0.45)],
                startPoint: .top, endPoint: .bottom
            )
            .allowsHitTesting(false)

            VStack(alignment: .leading, spacing: 0) {
                Text(timeStamp)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white)
                    .kerning(0.8)
                    .shadow(color: .black.opacity(0.5), radius: 2, x: 0, y: 1)
                    .padding(.top, 8)
                    .padding(.leading, 8)

                Spacer(minLength: 0)

                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text("\(Int(entry.calories))")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                        .kerning(-0.5)
                        .shadow(color: .black.opacity(0.5), radius: 2, x: 0, y: 1)
                    Text("KCAL")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.85))
                        .kerning(1)
                        .shadow(color: .black.opacity(0.5), radius: 2, x: 0, y: 1)
                }
                .padding(.bottom, 8)
                .padding(.leading, 10)
            }
        }
        .background(EatoColor.darkBrown)
    }

    @ViewBuilder
    private var photo: some View {
        if let urlString = entry.imageUrl, let url = URL(string: urlString) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                default:
                    placeholder
                }
            }
        } else {
            placeholder
        }
    }

    private var placeholder: some View {
        ZStack {
            placeholderTint
            Text(emojiFor(entry.foodName))
                .font(.system(size: 40))
                .opacity(0.85)
        }
    }

    /// Stable color from the food name's hash so legacy entries (no photo) feel
    /// distinct in the grid instead of all sharing one fallback color.
    private var placeholderTint: Color {
        let palette: [Color] = [
            EatoColor.terracottaSoft,
            EatoColor.sageSoft,
            EatoColor.cream,
            EatoColor.surfaceWarm,
        ]
        let h = entry.foodName.unicodeScalars.reduce(0) { $0 &+ Int($1.value) }
        return palette[abs(h) % palette.count]
    }

    private var timeStamp: String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: entry.consumedAt)
    }

    private func emojiFor(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.contains("coffee") || lower.contains("tea") || lower.contains("latte") { return "☕" }
        if lower.contains("salad") { return "🥗" }
        if lower.contains("pizza") { return "🍕" }
        if lower.contains("burger") { return "🍔" }
        if lower.contains("rice") { return "🍚" }
        if lower.contains("noodle") || lower.contains("pasta") || lower.contains("ramen") { return "🍜" }
        if lower.contains("apple") { return "🍎" }
        if lower.contains("banana") { return "🍌" }
        if lower.contains("egg") { return "🥚" }
        if lower.contains("bread") || lower.contains("toast") { return "🍞" }
        if lower.contains("chocolate") || lower.contains("cookie") || lower.contains("cake") { return "🍪" }
        if lower.contains("yogurt") || lower.contains("yoghurt") { return "🥛" }
        if lower.contains("strawberr") || lower.contains("berry") { return "🍓" }
        if lower.contains("water") { return "💧" }
        return "🍽️"
    }
}
