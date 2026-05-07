import SwiftUI

struct PostcardOverlay: View {
    let entry: FoodEntryDTO
    var onClose: () -> Void
    @State private var flipped: Bool = false

    var body: some View {
        ZStack {
            EatoColor.darkBrown.opacity(0.55)
                .ignoresSafeArea()
                .onTapGesture { onClose() }

            postcard
                .padding(.horizontal, Spacing.xl)
                .frame(maxWidth: 420)
                .onTapGesture {
                    withAnimation(.spring(duration: 0.55, bounce: 0.18)) {
                        flipped.toggle()
                    }
                }
                .gesture(
                    DragGesture()
                        .onEnded { value in
                            if value.translation.height > 80 { onClose() }
                        }
                )
        }
        .transition(.opacity.combined(with: .scale(scale: 0.96)))
    }

    private var postcard: some View {
        ZStack {
            front
                .opacity(flipped ? 0 : 1)
                .rotation3DEffect(
                    .degrees(flipped ? 180 : 0),
                    axis: (x: 0, y: 1, z: 0)
                )

            back
                .opacity(flipped ? 1 : 0)
                .rotation3DEffect(
                    .degrees(flipped ? 0 : -180),
                    axis: (x: 0, y: 1, z: 0)
                )
        }
        .softShadow(elevation: 24)
    }

    private var front: some View {
        VStack(spacing: 0) {
            // Photo / fallback fills the top.
            ZStack {
                EatoColor.terracottaSoft.opacity(0.4)
                if let urlString = entry.imageUrl, let url = URL(string: urlString) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        default:
                            EmptyView()
                        }
                    }
                } else {
                    Text("🍽️").font(.system(size: 96))
                }
            }
            .frame(height: 280)
            .clipShape(.rect(topLeadingRadius: Radius.lg, topTrailingRadius: Radius.lg))

            VStack(spacing: 8) {
                Text(entry.foodName)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .multilineTextAlignment(.center)

                HStack(spacing: 8) {
                    KCalBadge(kcal: Int(entry.calories), emphasized: true)
                    if let mood = Mood(rawValue: entry.mood ?? "") {
                        MoodTag(mood: mood)
                    }
                }

                Text("Tap to flip · Swipe down to close")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .padding(.top, Spacing.sm)
            }
            .padding(Spacing.lg)
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
    }

    private var back: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            HStack {
                Text(timestampText)
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundStyle(EatoColor.textTertiary)
                Spacer()
                Text(entry.mealType?.lowercased().capitalized ?? "—")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
            }

            Text(entry.foodName)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)

            if let note = entry.note, !note.isEmpty {
                Text(note)
                    .font(.system(size: 15, weight: .regular, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .italic()
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Text("No caption.")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .italic()
            }

            Spacer()

            macroRow

            Text("Tap to flip back")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(Spacing.lg)
        .frame(height: 460)
        .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: Radius.lg))
    }

    private var macroRow: some View {
        HStack(spacing: Spacing.md) {
            macroPill(label: "P", value: entry.protein, tint: EatoColor.sage)
            macroPill(label: "C", value: entry.carbs, tint: EatoColor.warning)
            macroPill(label: "F", value: entry.fat, tint: EatoColor.terracotta)
        }
    }

    private func macroPill(label: String, value: Double?, tint: Color) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
            Text(value.map { "\(Int($0))g" } ?? "—")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(tint.opacity(0.12), in: .rect(cornerRadius: Radius.md))
    }

    private var timestampText: String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: entry.consumedAt)
    }
}
