import SwiftUI

enum FriendsTab: String, CaseIterable, Identifiable {
    case feed, friends, circles, you
    var id: String { rawValue }
    var label: String {
        switch self {
        case .feed: return "Feed"
        case .friends: return "Friends"
        case .circles: return "Circles"
        case .you: return "You"
        }
    }
}

struct FriendsView: View {
    @Environment(SessionStore.self) private var session
    @Environment(DeepLinkRouter.self) private var router
    @State private var viewModel: FriendsViewModel?
    @State private var selection: FriendsTab = .feed
    @State private var lastAddedFriendName: String?
    @State private var showAddSheet: Bool = false
    @State private var pendingCircleNav: PendingCircleNav?

    struct PendingCircleNav: Identifiable, Hashable {
        var id: String { circleId + (momentId ?? "") }
        let circleId: String
        let momentId: String?
    }

    var body: some View {
        NavigationStack {
            ZStack {
                EatoColor.background.ignoresSafeArea()
                if let vm = viewModel {
                    @Bindable var vm = vm
                    content(vm)
                } else {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(item: $pendingCircleNav) { nav in
                if let momentId = nav.momentId {
                    MomentGridView(circleId: nav.circleId, momentId: momentId)
                } else {
                    CircleDetailView(circleId: nav.circleId)
                }
            }
        }
        .task {
            if viewModel == nil {
                viewModel = FriendsViewModel(api: session.api)
                await viewModel?.refreshAll()
            }
            if let pending = router.consumeFriendCode() {
                viewModel?.acceptCodeInput = pending
                showAddSheet = true
            }
            if let circle = router.consumeCircle() {
                selection = .circles
                pendingCircleNav = .init(circleId: circle.circleId, momentId: circle.momentId)
            }
        }
        .onChange(of: router.pendingCircleId) { _, newValue in
            // Fired when a CIRCLE_* push lands while the app is foregrounded
            // and FriendsView is already mounted.
            guard newValue != nil, let circle = router.consumeCircle() else { return }
            selection = .circles
            pendingCircleNav = .init(circleId: circle.circleId, momentId: circle.momentId)
        }
    }

    @ViewBuilder
    private func content(_ vm: FriendsViewModel) -> some View {
        VStack(spacing: 0) {
            header
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 14)

            subTabs
                .padding(.horizontal, 20)
                .padding(.bottom, 8)

            Group {
                switch selection {
                case .feed: FeedTab(vm: vm)
                case .friends: FriendsListTab(vm: vm, openAdd: { showAddSheet = true })
                case .circles: CirclesListView()
                case .you: YouTab(vm: vm, lastAddedFriendName: $lastAddedFriendName)
                }
            }
        }
        .sheet(isPresented: $showAddSheet) {
            AddFriendSheet(vm: vm) { name in
                lastAddedFriendName = name
                showAddSheet = false
                selection = .friends
            }
            .presentationDetents([.medium, .large])
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("EATING TOGETHER")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.4)
                Text("Friends")
                    .font(.system(size: 32, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
            }
            Spacer()
            Button {
                showAddSheet = true
            } label: {
                Circle()
                    .fill(EatoColor.terracotta.opacity(0.12))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(EatoColor.terracotta)
                    )
            }
            .buttonStyle(.plain)
        }
    }

    private var subTabs: some View {
        HStack(spacing: 4) {
            ForEach(FriendsTab.allCases) { tab in
                Button {
                    withAnimation(.smooth(duration: 0.18)) { selection = tab }
                } label: {
                    Text(tab.label)
                        .font(.system(size: 13, weight: .heavy, design: .rounded))
                        .foregroundStyle(
                            selection == tab ? EatoColor.textPrimary : EatoColor.textTertiary
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            selection == tab ? EatoColor.background : Color.clear,
                            in: Capsule()
                        )
                        .softShadow(elevation: selection == tab ? 2 : 0)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(EatoColor.surfaceWarm, in: Capsule())
    }
}

// MARK: - Feed

private struct FeedTab: View {
    @Bindable var vm: FriendsViewModel
    /// Local-only reaction state. Backend friend.toggleReaction is pending —
    /// reactions reset on app restart for now.
    @State private var localReactions: [String: ReactionState] = [:]

    struct ReactionState {
        var counts: [String: Int]
        var mine: String?
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if vm.feed.isEmpty && vm.feedState != .loading {
                    emptyState
                        .padding(.top, 40)
                        .padding(.horizontal, 16)
                } else {
                    ForEach(vm.feed) { item in
                        PostCard(
                            item: item,
                            reactions: localReactions[item.id] ?? .init(counts: [:], mine: nil),
                            onToggleReaction: { emoji in
                                toggleReaction(itemId: item.id, emoji: emoji)
                            }
                        )
                        .padding(.horizontal, 16)
                    }
                }
                Spacer(minLength: 40)
            }
            .padding(.top, 8)
        }
        .refreshable { await vm.loadFeed(reset: true) }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Text("📭").font(.system(size: 48))
            Text("Nothing in the feed yet")
                .font(.system(size: 16, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text("When friends log meals you'll see them here.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .background(EatoColor.surface, in: .rect(cornerRadius: 22))
        .softShadow(elevation: 4)
    }

    private func toggleReaction(itemId: String, emoji: String) {
        var state = localReactions[itemId] ?? .init(counts: [:], mine: nil)
        if let mine = state.mine {
            state.counts[mine] = max(0, (state.counts[mine] ?? 1) - 1)
            if (state.counts[mine] ?? 0) == 0 { state.counts.removeValue(forKey: mine) }
        }
        if state.mine == emoji {
            state.mine = nil
        } else {
            state.counts[emoji, default: 0] += 1
            state.mine = emoji
        }
        localReactions[itemId] = state
    }
}

private struct PostCard: View {
    let item: FriendFeedItemDTO
    let reactions: FeedTab.ReactionState
    var onToggleReaction: (String) -> Void
    @State private var pickerOpen = false

    private static let reactionOptions = ["😋", "❤️", "🔥", "👏", "😩", "🫶"]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 12) {
                Avatar(initials: initials, size: .md, tint: tint)
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.userName ?? "Friend")
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text(timeAgo + " · \(timestamp)")
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                Spacer()
                Text("\(Int(item.calories)) kcal")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(EatoColor.terracotta.opacity(0.1), in: Capsule())
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            // Photo
            if let urlString = item.imageUrl, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image): image.resizable().scaledToFill()
                    default: photoFallback
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 200)
                .clipped()
                .clipShape(.rect(cornerRadius: 14))
                .padding(.horizontal, 16)
            } else {
                photoFallback
                    .frame(height: 200)
                    .clipShape(.rect(cornerRadius: 14))
                    .padding(.horizontal, 16)
            }

            // Title + caption
            VStack(alignment: .leading, spacing: 6) {
                Text(item.name)
                    .font(.system(size: 17, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                if let note = item.note, !note.isEmpty {
                    Text(note)
                        .font(.system(size: 14, weight: .regular, design: .rounded))
                        .italic()
                        .foregroundStyle(EatoColor.textSecondary)
                        .lineSpacing(2)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)

            // Reaction strip
            reactionStrip
                .padding(.horizontal, 12)
                .padding(.top, 8)
                .padding(.bottom, 12)
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: 18))
        .softShadow(elevation: 4)
    }

    private var photoFallback: some View {
        ZStack {
            EatoColor.surfaceWarm
            Image(systemName: "fork.knife")
                .font(.system(size: 36, weight: .heavy))
                .foregroundStyle(EatoColor.terracotta.opacity(0.4))
        }
    }

    @ViewBuilder
    private var reactionStrip: some View {
        HStack(spacing: 6) {
            ForEach(Array(reactions.counts.keys), id: \.self) { emoji in
                let count = reactions.counts[emoji] ?? 0
                let mine = reactions.mine == emoji
                Button { onToggleReaction(emoji) } label: {
                    HStack(spacing: 5) {
                        Text(emoji).font(.system(size: 14))
                        Text("\(count)")
                            .font(.system(size: 12, weight: .heavy, design: .monospaced))
                            .foregroundStyle(mine ? EatoColor.terracotta : EatoColor.textSecondary)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        mine ? EatoColor.terracotta.opacity(0.15) : EatoColor.surfaceWarm,
                        in: Capsule()
                    )
                    .overlay(
                        Capsule().strokeBorder(
                            mine ? EatoColor.terracotta : .clear,
                            lineWidth: 1.5
                        )
                    )
                }
                .buttonStyle(.plain)
            }

            if pickerOpen {
                HStack(spacing: 4) {
                    ForEach(Self.reactionOptions, id: \.self) { e in
                        Button {
                            onToggleReaction(e)
                            pickerOpen = false
                        } label: {
                            Text(e).font(.system(size: 16))
                                .frame(width: 28, height: 28)
                        }
                        .buttonStyle(.plain)
                    }
                    Button { pickerOpen = false } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(EatoColor.textTertiary)
                            .frame(width: 28, height: 28)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 8)
                .background(EatoColor.surfaceWarm, in: Capsule())
            } else {
                Button { pickerOpen = true } label: {
                    Image(systemName: "face.smiling")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(EatoColor.textTertiary)
                        .frame(width: 32, height: 32)
                        .background(EatoColor.surfaceWarm, in: Circle())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var initials: String {
        let parts = (item.userName ?? "?").split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)) }
        return String((item.userName ?? "?").prefix(1)).uppercased()
    }

    private var tint: Color {
        let palette: [Color] = [
            EatoColor.terracotta, EatoColor.sage, EatoColor.warning, EatoColor.darkBrown,
        ]
        return palette[abs(item.userId.hashValue) % palette.count]
    }

    private var timeAgo: String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f.localizedString(for: item.consumedAt, relativeTo: Date())
    }

    private var timestamp: String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: item.consumedAt)
    }
}

// MARK: - Friends list

private struct FriendsListTab: View {
    @Bindable var vm: FriendsViewModel
    var openAdd: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                addFriendTile

                if !vm.friends.isEmpty {
                    Text("FRIENDS · \(vm.friends.count)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .kerning(1.2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)
                        .padding(.top, 8)

                    ForEach(vm.friends) { friend in
                        friendRow(friend)
                    }
                } else if vm.listState == .loaded {
                    emptyState
                        .padding(.top, 30)
                }
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
        .refreshable { await vm.loadFriends() }
    }

    private var addFriendTile: some View {
        Button(action: openAdd) {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 14)
                    .fill(EatoColor.terracotta.opacity(0.12))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: "plus")
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(EatoColor.terracotta)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text("Add a friend")
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text("Enter their friend code")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            .padding(14)
            .background(EatoColor.surface, in: .rect(cornerRadius: 18))
            .softShadow(elevation: 4)
        }
        .buttonStyle(.plain)
    }

    private func friendRow(_ friend: FriendDTO) -> some View {
        HStack(spacing: 12) {
            Avatar(initials: initials(friend.name ?? friend.email), size: .md)
            VStack(alignment: .leading, spacing: 1) {
                Text(friend.name ?? friend.email)
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("Added \(relative(friend.friendedAt))")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            Menu {
                Button("Remove friend", role: .destructive) {
                    Task { await vm.remove(friend: friend) }
                }
            } label: {
                Image(systemName: "ellipsis")
                    .foregroundStyle(EatoColor.textTertiary)
                    .padding(8)
            }
        }
        .padding(12)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Text("🌱").font(.system(size: 40))
            Text("No friends yet")
                .font(.system(size: 15, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text("Tap Add a friend above, or share your code from the You tab.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
    }

    private func initials(_ s: String) -> String {
        let parts = s.split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)) }
        return String(s.prefix(1)).uppercased()
    }

    private func relative(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        return f.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - You

private struct YouTab: View {
    @Bindable var vm: FriendsViewModel
    @Binding var lastAddedFriendName: String?
    @State private var copiedFlash: Bool = false
    @State private var privacyAutoShare: Bool = true
    @State private var privacyShowKcal: Bool = true
    @State private var privacyAllowReactions: Bool = true
    @State private var privacyDiscoverable: Bool = true

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                gradientCodeCard
                statTiles
                privacyCard
                if let last = lastAddedFriendName {
                    Pill(
                        text: "You and \(last) are now friends",
                        icon: "checkmark.circle.fill",
                        tint: EatoColor.sage,
                        background: EatoColor.sageSoft.opacity(0.4)
                    )
                }
                if let err = vm.lastError {
                    Text(err)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.danger)
                }
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
    }

    private var gradientCodeCard: some View {
        ZStack(alignment: .topLeading) {
            LinearGradient(
                colors: [EatoColor.terracotta, EatoColor.terracotta.opacity(0.7)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .clipShape(.rect(cornerRadius: 18))

            VStack(alignment: .leading, spacing: 8) {
                Text("YOUR FRIEND CODE")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
                    .kerning(1.4)

                if let code = vm.myCode {
                    Text(code.code)
                        .font(.system(size: 38, weight: .heavy, design: .monospaced))
                        .foregroundStyle(.white)
                        .kerning(4)
                } else {
                    Button {
                        Task { await vm.generateMyCode() }
                    } label: {
                        Text(vm.isWorking ? "Generating…" : "Generate code")
                            .font(.system(size: 18, weight: .heavy, design: .monospaced))
                            .foregroundStyle(.white)
                            .kerning(2)
                            .padding(.vertical, 6)
                    }
                    .buttonStyle(.plain)
                    .disabled(vm.isWorking)
                }

                Text("Share with a friend so they can follow your meals")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.92))
                    .padding(.top, 2)

                if vm.myCode != nil {
                    HStack(spacing: 8) {
                        Button {
                            UIPasteboard.general.string = vm.myCode?.code
                            copiedFlash = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
                                copiedFlash = false
                            }
                        } label: {
                            Text(copiedFlash ? "✓ Copied" : "Copy code")
                                .font(.system(size: 13, weight: .heavy, design: .rounded))
                                .foregroundStyle(EatoColor.terracotta)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(.white, in: Capsule())
                        }
                        .buttonStyle(.plain)

                        ShareLink(item: shareText) {
                            Text("Share link")
                                .font(.system(size: 13, weight: .heavy, design: .rounded))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(.white.opacity(0.18), in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 8)
                }
            }
            .padding(20)
        }
    }

    private var shareText: String {
        if let code = vm.myCode?.code {
            return "Add me on Eato: \(code)"
        }
        return "Add me on Eato"
    }

    /// Single-tile stat row. Posts / Reacts tiles are intentionally omitted
    /// until the backend exposes those counts (deferred with the rest of the
    /// reactions/feed-aggregation work). Showing hardcoded `0` would mislead.
    private var statTiles: some View {
        HStack(spacing: 10) {
            youStatTile(label: "Friends", value: vm.friends.count)
        }
    }

    private func youStatTile(label: String, value: Int) -> some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: 24, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .monospacedDigit()
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(0.6)
        }
        .frame(maxWidth: .infinity)
        .padding(14)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
    }

    private var privacyCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("PRIVACY")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.2)
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 10)

            privacyRow(title: "Auto-share new meals", subtitle: "Friends see your entries as you log", isOn: $privacyAutoShare, isLast: false)
            privacyDivider
            privacyRow(title: "Show calorie counts", subtitle: "Numbers visible on your posts", isOn: $privacyShowKcal, isLast: false)
            privacyDivider
            privacyRow(title: "Allow reactions", subtitle: "Friends can react and comment", isOn: $privacyAllowReactions, isLast: false)
            privacyDivider
            privacyRow(title: "Discoverable by code only", subtitle: "You won't show up in search", isOn: $privacyDiscoverable, isLast: true)
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: 18))
        .softShadow(elevation: 2)
    }

    private func privacyRow(title: String, subtitle: String, isOn: Binding<Bool>, isLast: Bool) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text(subtitle)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(EatoColor.terracotta)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, isLast ? 14 : 12)
    }

    private var privacyDivider: some View {
        Rectangle()
            .fill(EatoColor.divider.opacity(0.6))
            .frame(height: 1)
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
    }
}

// MARK: - Add friend sheet

private struct AddFriendSheet: View {
    @Bindable var vm: FriendsViewModel
    var onAdded: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Capsule()
                .fill(EatoColor.divider)
                .frame(width: 38, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

            Text("Add a friend")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .padding(.top, 4)

            Text("Ask them for their friend code, or paste a link.")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)

            HStack(spacing: 8) {
                TextField("ABC123", text: $vm.acceptCodeInput)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .font(.system(size: 22, weight: .heavy, design: .monospaced))
                    .kerning(4)
                    .padding(.horizontal, 18)
                    .frame(height: 52)
                    .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: 14))
                Button {
                    Task {
                        if let name = await vm.acceptCode() {
                            onAdded(name)
                            dismiss()
                        }
                    }
                } label: {
                    Text(vm.isWorking ? "Adding…" : "Find")
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18)
                        .frame(height: 52)
                        .background(EatoColor.terracotta, in: Capsule())
                }
                .buttonStyle(.plain)
                .disabled(vm.acceptCodeInput.trimmingCharacters(in: .whitespacesAndNewlines).count != 6 || vm.isWorking)
                .opacity(vm.acceptCodeInput.trimmingCharacters(in: .whitespacesAndNewlines).count != 6 ? 0.4 : 1)
            }
            .padding(.top, 4)

            Text("Friend codes are private. Share yours from the You tab.")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .padding(.top, 4)

            if let err = vm.lastError {
                Text(err)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.danger)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
        .background(EatoColor.background)
    }
}
