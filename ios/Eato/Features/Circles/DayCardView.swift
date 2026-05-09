import SwiftUI

/// Day Card composited image with native share sheet. The backend lazily
/// composes the image on first request, so a freshly opened day might
/// show "preparing…" before the URL resolves.
struct DayCardView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    let circleId: String
    let date: Date

    @State private var card: DayCardDTO?
    @State private var loading: Bool = true
    @State private var error: String?

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()
            VStack(spacing: 16) {
                if loading {
                    ProgressView().tint(EatoColor.terracotta)
                    Text("Composing your day card…")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                } else if let card {
                    cardImage(card)
                    if let url = URL(string: card.imageUrl) {
                        ShareLink(item: url) {
                            Label("Share day card", systemImage: "square.and.arrow.up")
                                .font(.system(size: 14, weight: .heavy, design: .rounded))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 14)
                                .background(EatoColor.terracotta, in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                } else {
                    VStack(spacing: 8) {
                        Text("No day card yet")
                            .font(.system(size: 16, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.textPrimary)
                        Text(error ?? "Once your circle has logged at least one moment, your day card will appear here.")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(EatoColor.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                }
            }
            .padding(.vertical, 30)
        }
        .navigationTitle("Day card")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    @ViewBuilder
    private func cardImage(_ card: DayCardDTO) -> some View {
        if let url = URL(string: card.imageUrl) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().scaledToFit()
                default:
                    ProgressView().tint(EatoColor.terracotta)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        let dateStr = f.string(from: date)
        do {
            card = try await session.api.send(MealMomentAPI.dayCard(circleId: circleId, date: dateStr))
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
