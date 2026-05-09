import SwiftUI

/// Per-meal split grid showing every member's slot. Empty slots render
/// with the member's name label so accountability stays visible (per the
/// "showEmptySlots" circle setting).
struct MomentGridView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    let circleId: String
    let momentId: String

    @State private var moment: MealMomentDTO?
    @State private var error: String?
    @State private var isLoading: Bool = true
    @State private var showCapture: Bool = false

    private static let reactionPalette = ["❤️", "🔥", "😋", "👏", "🥲", "😂"]

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()
            if isLoading {
                ProgressView().tint(EatoColor.terracotta)
            } else if let moment {
                content(moment)
            } else if let error {
                Text(error)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.danger)
                    .padding()
            }
        }
        .navigationTitle(moment?.label ?? "Moment")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .fullScreenCover(isPresented: $showCapture) {
            if let moment {
                NavigationStack {
                    MomentCaptureView(
                        circleId: circleId,
                        momentId: moment.id,
                        label: moment.label,
                        circleEmoji: "🍽️"
                    ) {
                        showCapture = false
                        Task { await load() }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func content(_ moment: MealMomentDTO) -> some View {
        ScrollView {
            VStack(spacing: 14) {
                summaryBar(moment)
                grid(moment)
                if !mineIsLogged(moment) && Date() < moment.closesAt {
                    Button { showCapture = true } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                            Text("Add my plate")
                        }
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(EatoColor.terracotta, in: Capsule())
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 16)
                }
                Spacer(minLength: 30)
            }
            .padding(.top, 12)
        }
        .refreshable { await load() }
    }

    private func summaryBar(_ moment: MealMomentDTO) -> some View {
        let filled = moment.entries.filter { $0.foodEntryId != nil }.count
        let total = moment.entries.count
        return HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(filled) of \(total) logged")
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text(timeStamp(moment.firedAt))
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            if Date() < moment.closesAt {
                Text("Open")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(EatoColor.sage, in: Capsule())
            } else {
                Text("Closed")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(EatoColor.surfaceWarm, in: Capsule())
            }
        }
        .padding(14)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
        .padding(.horizontal, 16)
    }

    private func grid(_ moment: MealMomentDTO) -> some View {
        let cols = moment.entries.count <= 2 ? 1 : 2
        let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: cols)
        return LazyVGrid(columns: columns, spacing: 10) {
            ForEach(moment.entries) { entry in
                slot(entry)
            }
        }
        .padding(.horizontal, 16)
    }

    @ViewBuilder
    private func slot(_ entry: MomentEntrySlotDTO) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Photo or empty placeholder.
            ZStack {
                if let urlString = entry.photoUrl, let url = URL(string: urlString) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let img): img.resizable().scaledToFill()
                        default: emptyPlaceholder
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 180)
                    .clipped()
                } else {
                    emptyPlaceholder
                        .frame(maxWidth: .infinity)
                        .frame(height: 180)
                }
            }
            .clipShape(.rect(topLeadingRadius: 14, topTrailingRadius: 14))

            VStack(alignment: .leading, spacing: 4) {
                Text(entry.userName ?? "Member")
                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                if let note = entry.note, !note.isEmpty {
                    Text(note)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .italic()
                        .foregroundStyle(EatoColor.textSecondary)
                        .lineLimit(2)
                } else if entry.foodEntryId == nil {
                    Text("didn't log")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                } else if let ms = entry.loggedAtMs, ms > 60_000 {
                    Text("logged \(ms / 60_000)m late")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                if entry.foodEntryId != nil {
                    reactionStrip(entry: entry)
                        .padding(.top, 4)
                }
            }
            .padding(10)
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: 14))
        .softShadow(elevation: 2)
    }

    private var emptyPlaceholder: some View {
        ZStack {
            EatoColor.surfaceWarm
            Image(systemName: "fork.knife")
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(EatoColor.terracotta.opacity(0.4))
        }
    }

    @ViewBuilder
    private func reactionStrip(entry: MomentEntrySlotDTO) -> some View {
        // Aggregate counts by emoji.
        let counts = Dictionary(grouping: entry.reactions, by: { $0.emoji })
            .mapValues { $0.count }
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(Self.reactionPalette, id: \.self) { emoji in
                    Button {
                        Task { await react(entryId: entry.id, emoji: emoji) }
                    } label: {
                        HStack(spacing: 3) {
                            Text(emoji).font(.system(size: 13))
                            if let n = counts[emoji], n > 0 {
                                Text("\(n)")
                                    .font(.system(size: 10, weight: .heavy, design: .monospaced))
                                    .foregroundStyle(EatoColor.textSecondary)
                            }
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(EatoColor.surfaceWarm, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Data helpers

    private func mineIsLogged(_ moment: MealMomentDTO) -> Bool {
        guard let me = session.currentUser?.id else { return false }
        return moment.entries.contains { $0.userId == me && $0.foodEntryId != nil }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            // No single-moment endpoint — pull the recent feed and find ours.
            let resp = try await session.api.send(MealMomentAPI.feed(circleId: circleId, cursor: nil))
            moment = resp.items.first { $0.id == momentId }
            if moment == nil {
                error = "Moment not found"
            }
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func react(entryId: String, emoji: String) async {
        do {
            _ = try await session.api.send(MealMomentAPI.react(.init(entryId: entryId, emoji: emoji)))
            await load()
        } catch {
            // Silently swallow — user just sees no state change.
        }
    }

    private func timeStamp(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d · h:mm a"
        return f.string(from: d)
    }
}
