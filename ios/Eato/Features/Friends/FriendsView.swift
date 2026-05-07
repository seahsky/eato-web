import SwiftUI

enum FriendsTab: String, CaseIterable, Identifiable {
    case feed, friends, you
    var id: String { rawValue }
    var label: String {
        switch self {
        case .feed: return "Feed"
        case .friends: return "Friends"
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
            .navigationTitle("Friends")
            .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            if viewModel == nil {
                viewModel = FriendsViewModel(api: session.api)
                await viewModel?.refreshAll()
            }

            // Pre-fill the accept field if we arrived here from a deep link.
            if let pending = router.consumeFriendCode() {
                viewModel?.acceptCodeInput = pending
                selection = .you
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: FriendsViewModel) -> some View {
        VStack(spacing: 0) {
            segmented
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.md)
                .padding(.bottom, Spacing.sm)

            Group {
                switch selection {
                case .feed: FeedTab(vm: vm)
                case .friends: FriendsListTab(vm: vm)
                case .you: YouTab(vm: vm, lastAddedFriendName: $lastAddedFriendName)
                }
            }
        }
    }

    private var segmented: some View {
        HStack(spacing: 4) {
            ForEach(FriendsTab.allCases) { tab in
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

// MARK: - Feed

private struct FeedTab: View {
    @Bindable var vm: FriendsViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                if vm.feed.isEmpty && vm.feedState != .loading {
                    emptyState
                        .padding(.top, Spacing.xxl)
                } else {
                    ForEach(vm.feed) { item in
                        feedRow(item)
                    }
                    if vm.feedHasMore {
                        Button {
                            Task { await vm.loadFeed(reset: false) }
                        } label: {
                            Text("Load more")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(EatoColor.terracotta)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, Spacing.sm)
                        }
                    }
                }
                Spacer(minLength: Spacing.xxl)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.sm)
        }
        .refreshable { await vm.loadFeed(reset: true) }
    }

    private var emptyState: some View {
        VStack(spacing: Spacing.md) {
            Text("📭").font(.system(size: 48))
            Text("Nothing in the feed yet")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text("When friends log meals you'll see them here.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.xl)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 4)
    }

    private func feedRow(_ item: FriendFeedItemDTO) -> some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            Avatar(initials: initials(item.userName), size: .md, tint: tint(for: item.userId))

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Text(item.userName ?? "Friend")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text("·")
                        .foregroundStyle(EatoColor.textTertiary)
                    Text(timestamp(item.consumedAt))
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                Text(item.name)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                HStack(spacing: 6) {
                    KCalBadge(kcal: Int(item.calories))
                    if let mood = Mood(rawValue: item.mood ?? "") {
                        MoodTag(mood: mood)
                    }
                }
                if let note = item.note, !note.isEmpty {
                    Text(note)
                        .font(.system(size: 12, weight: .regular, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                        .italic()
                        .padding(.top, 2)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 3)
    }

    private func initials(_ name: String?) -> String {
        let parts = (name ?? "?").split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)) }
        return String((name ?? "?").prefix(2))
    }

    private func tint(for id: String) -> Color {
        let palette: [Color] = [EatoColor.terracotta, EatoColor.sage, EatoColor.warning, EatoColor.darkBrown]
        return palette[abs(id.hashValue) % palette.count]
    }

    private func timestamp(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Friends list

private struct FriendsListTab: View {
    @Bindable var vm: FriendsViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                if vm.friends.isEmpty {
                    emptyState
                        .padding(.top, Spacing.xxl)
                } else {
                    ForEach(vm.friends) { friend in
                        friendRow(friend)
                    }
                }
                Spacer(minLength: Spacing.xxl)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.sm)
        }
        .refreshable { await vm.loadFriends() }
    }

    private var emptyState: some View {
        VStack(spacing: Spacing.md) {
            Text("🌱").font(.system(size: 48))
            Text("No friends yet")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text("Open the You tab to share your code, or accept a friend's code.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.xl)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 4)
    }

    private func friendRow(_ friend: FriendDTO) -> some View {
        HStack(spacing: Spacing.md) {
            Avatar(initials: initials(friend.name ?? friend.email), size: .md)
            VStack(alignment: .leading, spacing: 2) {
                Text(friend.name ?? friend.email)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
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
                    .foregroundStyle(EatoColor.textSecondary)
                    .padding(8)
            }
        }
        .padding(Spacing.md)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 3)
    }

    private func initials(_ s: String) -> String {
        let parts = s.split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)) }
        return String(s.prefix(2))
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

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                myCodeCard
                acceptCard
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
                        .padding(.horizontal, Spacing.sm)
                }
                Spacer(minLength: Spacing.xxl)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.sm)
        }
    }

    private var myCodeCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text("Your friend code".uppercased())
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)

                if let code = vm.myCode {
                    Text(code.code)
                        .font(.system(size: 40, weight: .bold, design: .monospaced))
                        .foregroundStyle(EatoColor.terracotta)
                        .kerning(4)
                    Text("Expires \(expiryText(code.expiresAt))")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                    HStack(spacing: Spacing.sm) {
                        Button {
                            UIPasteboard.general.string = code.code
                        } label: {
                            Label("Copy", systemImage: "doc.on.doc.fill")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(EatoColor.terracotta)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(EatoColor.terracottaSoft.opacity(0.35), in: Capsule())
                        }
                        .buttonStyle(.plain)

                        Button {
                            Task { await vm.generateMyCode() }
                        } label: {
                            Label("New code", systemImage: "arrow.clockwise")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(EatoColor.textSecondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(EatoColor.surfaceWarm, in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                } else {
                    Button {
                        Task { await vm.generateMyCode() }
                    } label: {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("Generate code")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                        }
                        .foregroundStyle(EatoColor.accentContrast)
                        .padding(.horizontal, Spacing.lg)
                        .padding(.vertical, Spacing.sm)
                        .background(EatoColor.terracotta, in: Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(vm.isWorking)
                }
            }
        }
    }

    private var acceptCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text("Add a friend".uppercased())
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                Text("Enter their 6-character code:")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                TextField("ABC123", text: $vm.acceptCodeInput)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .font(.system(size: 22, weight: .bold, design: .monospaced))
                    .kerning(4)
                    .padding(Spacing.md)
                    .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: Radius.md))
                Button {
                    Task {
                        if let name = await vm.acceptCode() {
                            lastAddedFriendName = name
                        }
                    }
                } label: {
                    HStack {
                        if vm.isWorking { ProgressView().tint(.white) }
                        Text(vm.isWorking ? "Adding…" : "Add friend")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.sm)
                    .foregroundStyle(EatoColor.accentContrast)
                    .background(EatoColor.terracotta, in: Capsule())
                }
                .buttonStyle(.plain)
                .disabled(vm.acceptCodeInput.trimmingCharacters(in: .whitespacesAndNewlines).count != 6 || vm.isWorking)
                .opacity(vm.acceptCodeInput.trimmingCharacters(in: .whitespacesAndNewlines).count != 6 ? 0.4 : 1)
            }
        }
    }

    private func expiryText(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        return f.localizedString(for: date, relativeTo: Date())
    }
}
