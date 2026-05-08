import SwiftUI

/// Tap-to-flip postcard overlay. The overlay uses `matchedGeometryEffect` so
/// it animates outward from the source `StackCard`'s frame to a centered
/// 260×340 target, then a `rotation3DEffect` flips it to the back.
/// Mirrors `dashboard.jsx` `PostcardOverlay`.
struct PostcardOverlay: View {
    let entry: FoodEntryDTO
    let namespace: Namespace.ID
    var onClose: () -> Void
    @State private var phase: Phase = .preOpen

    enum Phase { case preOpen, open, closing }

    private let targetSize = CGSize(width: 260, height: 340)

    var body: some View {
        ZStack {
            // Backdrop dim + blur (blur first, then dim color on top).
            BackdropBlur(intensity: phase == .open ? 8 : 0)
                .ignoresSafeArea()
            EatoColor.darkBrown
                .opacity(phase == .open ? 0.55 : 0)
                .ignoresSafeArea()
                .onTapGesture { close() }

            card
                .frame(width: targetSize.width, height: targetSize.height)
                .matchedGeometryEffect(id: entry.id, in: namespace, isSource: false)

            if phase == .open {
                Button(action: close) {
                    HStack(spacing: 6) {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .bold))
                        Text("Put it back")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                    }
                    .foregroundStyle(EatoColor.darkBrown)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 8)
                    .background(.white.opacity(0.95), in: Capsule())
                    .shadow(color: .black.opacity(0.25), radius: 8, x: 0, y: 4)
                }
                .buttonStyle(.plain)
                .padding(.bottom, 80)
                .frame(maxHeight: .infinity, alignment: .bottom)
                .transition(.opacity.animation(.easeIn(duration: 0.25).delay(0.35)))
            }
        }
        .onAppear { withAnimation(.timingCurve(0.22, 0.61, 0.36, 1, duration: 0.62)) { phase = .open } }
    }

    private func close() {
        withAnimation(.timingCurve(0.22, 0.61, 0.36, 1, duration: 0.45)) {
            phase = .closing
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
            onClose()
        }
    }

    private var card: some View {
        ZStack {
            CardFront(entry: entry)
                .clipShape(.rect(cornerRadius: 14))
                .opacity(phase == .open ? 0 : 1)
                .rotation3DEffect(
                    .degrees(phase == .open ? 180 : 0),
                    axis: (x: 0, y: 1, z: 0),
                    perspective: 0.7
                )

            PostcardBack(entry: entry)
                .clipShape(.rect(cornerRadius: 14))
                .opacity(phase == .open ? 1 : 0)
                .rotation3DEffect(
                    .degrees(phase == .open ? 0 : -180),
                    axis: (x: 0, y: 1, z: 0),
                    perspective: 0.7
                )
        }
        .shadow(
            color: phase == .open
                ? EatoColor.darkBrown.opacity(0.45)
                : EatoColor.darkBrown.opacity(0.16),
            radius: phase == .open ? 30 : 7,
            x: 0,
            y: phase == .open ? 20 : 4
        )
    }
}

// MARK: - Postcard back face

struct PostcardBack: View {
    let entry: FoodEntryDTO

    private let paper = Color(red: 0xF6 / 255, green: 0xEF / 255, blue: 0xE3 / 255)
    private let paperDark = Color(red: 0xE8 / 255, green: 0xDC / 255, blue: 0xC6 / 255)
    private let ink = Color(red: 0x3D / 255, green: 0x2A / 255, blue: 0x1F / 255)
    private let inkSoft = Color(red: 0x6E / 255, green: 0x5A / 255, blue: 0x4C / 255)

    var body: some View {
        ZStack(alignment: .topTrailing) {
            ruledPaper
                .ignoresSafeArea()

            stamp
                .padding(.top, 16)
                .padding(.trailing, 16)

            VStack(alignment: .leading, spacing: 0) {
                Text(metaLine)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(inkSoft)
                    .kerning(1.2)
                    .padding(.trailing, 70) // make room for stamp

                Text(entry.foodName)
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundStyle(ink)
                    .kerning(-0.2)
                    .lineLimit(2)
                    .padding(.top, 8)
                    .padding(.trailing, 70)

                Text("\(Int(entry.calories)) kcal\(moodSuffix)")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(inkSoft)
                    .padding(.top, 4)

                Rectangle()
                    .fill(ink.opacity(0.14))
                    .frame(height: 1)
                    .padding(.vertical, 14)

                Text(caption)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .italic()
                    .foregroundStyle(ink)
                    .lineSpacing(3)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Spacer(minLength: 0)

                Text("— m.")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .italic()
                    .foregroundStyle(inkSoft)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(.top, 10)
            }
            .padding(18)
        }
    }

    private var ruledPaper: some View {
        ZStack {
            paper
            // Simulate the JSX `repeating-linear-gradient` of 28px ruled lines.
            GeometryReader { geo in
                let step: CGFloat = 28
                let count = Int(geo.size.height / step) + 1
                VStack(spacing: 0) {
                    ForEach(0..<count, id: \.self) { _ in
                        Color.clear
                            .frame(height: step - 1)
                        Rectangle()
                            .fill(Color(red: 0xD4 / 255, green: 0xB2 / 255, blue: 0x78 / 255).opacity(0.10))
                            .frame(height: 1)
                    }
                }
            }
        }
    }

    private var stamp: some View {
        RoundedRectangle(cornerRadius: 4)
            .fill(paperDark)
            .frame(width: 56, height: 68)
            .overlay(
                RoundedRectangle(cornerRadius: 4)
                    .strokeBorder(
                        ink.opacity(0.18),
                        style: StrokeStyle(lineWidth: 1.5, dash: [3, 3])
                    )
            )
            .overlay(
                Text(moodEmoji)
                    .font(.system(size: 32))
            )
            .rotationEffect(.degrees(4))
    }

    // MARK: helpers
    private var metaLine: String {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        let date = f.string(from: entry.consumedAt).uppercased()
        let t = DateFormatter()
        t.dateFormat = "HH:mm"
        let time = t.string(from: entry.consumedAt)
        let serving: String = {
            guard let size = entry.servingSize, let unit = entry.servingUnit else { return "" }
            let formatted = size.truncatingRemainder(dividingBy: 1) == 0
                ? "\(Int(size))" : String(format: "%.1f", size)
            return " · \(formatted)\(unit)"
        }()
        return "\(date) · \(time)\(serving)"
    }

    private var moodSuffix: String {
        guard let raw = entry.mood, let m = Mood(rawValue: raw) else { return "" }
        return " · \(m.label)"
    }

    private var moodEmoji: String {
        guard let raw = entry.mood, let m = Mood(rawValue: raw) else { return "✺" }
        switch m {
        case .great: return "★"
        case .good: return "♡"
        case .meh: return "·"
        case .off: return "▢"
        }
    }

    private var caption: String {
        if let note = entry.note, !note.isEmpty { return note }
        return "A small moment. Noted."
    }
}

// MARK: - UIKit blur bridge for the backdrop

private struct BackdropBlur: UIViewRepresentable {
    var intensity: CGFloat

    func makeUIView(context: Context) -> UIVisualEffectView {
        UIVisualEffectView(effect: nil)
    }

    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {
        UIView.animate(withDuration: 0.6) {
            uiView.effect = intensity > 0 ? UIBlurEffect(style: .systemUltraThinMaterialDark) : nil
        }
    }
}
