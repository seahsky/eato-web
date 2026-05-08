import SwiftUI

/// One of three preset deltas around TDEE — Lose (-500), Maintain (TDEE),
/// Gain (+500). Computed locally from the current `calorieGoal` vs `tdee`
/// since the backend doesn't carry an explicit `goalKind` column.
enum GoalKind: String, CaseIterable, Identifiable {
    case lose, maintain, gain
    var id: String { rawValue }
    var label: String {
        switch self {
        case .lose: "Lose"
        case .maintain: "Maintain"
        case .gain: "Gain"
        }
    }
    var deltaFromTDEE: Double {
        switch self {
        case .lose: -500
        case .maintain: 0
        case .gain: 500
        }
    }

    static func infer(calorieGoal: Double, tdee: Double) -> GoalKind {
        let diff = calorieGoal - tdee
        if diff <= -250 { return .lose }
        if diff >= 250 { return .gain }
        return .maintain
    }
}

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: ProfileViewModel?

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
        }
        .task {
            if viewModel == nil {
                viewModel = ProfileViewModel(api: session.api) { [session] in
                    await session.loadMe()
                }
            }
            await viewModel?.load()
        }
    }

    @ViewBuilder
    private func content(_ vm: ProfileViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                pageHeader
                    .padding(.horizontal, 24)
                    .padding(.top, 8)

                avatarCard
                    .padding(.horizontal, 20)

                statsGrid
                    .padding(.horizontal, 20)

                sectionTitle("Your goal")
                goalPills(vm: vm)
                    .padding(.horizontal, 20)

                sectionTitle("Activity level")
                activityCard(vm: vm)
                    .padding(.horizontal, 20)

                sectionTitle("Gentle nudges")
                notificationsCard(vm: vm)
                    .padding(.horizontal, 20)

                signOutButton
                    .padding(.horizontal, 20)
                    .padding(.top, 8)

                footer
                    .padding(.top, 14)
                    .padding(.bottom, 30)
            }
        }
        .refreshable { await vm.load() }
    }

    // MARK: - Page header

    private var pageHeader: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("ABOUT YOU")
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.4)
            Text("Profile")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Avatar header card

    private var avatarCard: some View {
        Card {
            HStack(spacing: 14) {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [EatoColor.terracottaSoft, EatoColor.terracotta],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 66, height: 66)
                    .overlay(
                        Text(initials)
                            .font(.system(size: 26, weight: .heavy, design: .rounded))
                            .foregroundStyle(.white)
                    )
                VStack(alignment: .leading, spacing: 4) {
                    Text(displayName)
                        .font(.system(size: 26, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text(subline)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                }
                Spacer()
            }
            .padding(.vertical, 4)
        }
    }

    // MARK: - 3-tile stats

    private var statsGrid: some View {
        let bmr = Int(session.currentUser?.profile?.bmr ?? 0)
        let tdee = Int(session.currentUser?.profile?.tdee ?? 0)
        let weekTarget = Int((session.currentUser?.profile?.calorieGoal ?? 0) * 7)
        return HStack(spacing: 8) {
            statTile(label: "BMR", value: bmr, unit: "kcal")
            statTile(label: "TDEE", value: tdee, unit: "kcal/d")
            statTile(label: "Week", value: weekTarget, unit: "kcal")
        }
    }

    private func statTile(label: String, value: Int, unit: String) -> some View {
        VStack(spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.0)
            Text("\(value)")
                .font(.system(size: 18, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .monospacedDigit()
            Text(unit)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .padding(.horizontal, 8)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
    }

    // MARK: - Goal pills

    private func goalPills(vm: ProfileViewModel) -> some View {
        let tdee = session.currentUser?.profile?.tdee ?? 0
        let current = session.currentUser?.profile?.calorieGoal ?? 0
        let inferred = GoalKind.infer(calorieGoal: current, tdee: tdee)
        return HStack(spacing: 8) {
            ForEach(GoalKind.allCases) { kind in
                Button {
                    Task {
                        await vm.updateGoal(tdee + kind.deltaFromTDEE)
                    }
                } label: {
                    Text(kind.label)
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .foregroundStyle(
                            inferred == kind ? .white : EatoColor.textPrimary
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            inferred == kind ? EatoColor.terracotta : EatoColor.surface,
                            in: .rect(cornerRadius: 14)
                        )
                        .shadow(
                            color: inferred == kind
                                ? EatoColor.terracotta.opacity(0.28)
                                : .black.opacity(0.04),
                            radius: inferred == kind ? 12 : 4,
                            x: 0,
                            y: inferred == kind ? 4 : 1
                        )
                }
                .buttonStyle(.plain)
                .disabled(vm.isSaving || tdee == 0)
            }
        }
    }

    // MARK: - Activity card

    private func activityCard(vm: ProfileViewModel) -> some View {
        let levels: [ActivityLevel] = [
            .sedentary, .lightlyActive, .moderatelyActive, .active,
        ]
        let currentRaw = session.currentUser?.profile?.activityLevel ?? ""
        let current = ActivityLevel(rawValue: currentRaw)
        return VStack(spacing: 0) {
            ForEach(Array(levels.enumerated()), id: \.element) { index, level in
                Button {
                    if let profile = session.currentUser?.profile {
                        Task { await vm.updateActivityLevel(level, currentProfile: profile) }
                    }
                } label: {
                    HStack(spacing: 12) {
                        radio(filled: current == level)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(level.label)
                                .font(.system(size: 15, weight: .heavy, design: .rounded))
                                .foregroundStyle(EatoColor.textPrimary)
                            Text(level.hint)
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(EatoColor.textTertiary)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }
                .buttonStyle(.plain)
                .disabled(vm.isSaving)

                if index < levels.count - 1 {
                    Rectangle()
                        .fill(EatoColor.divider.opacity(0.6))
                        .frame(height: 1)
                        .padding(.leading, 50)
                }
            }
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
    }

    private func radio(filled: Bool) -> some View {
        Circle()
            .strokeBorder(
                filled ? EatoColor.terracotta : EatoColor.divider,
                lineWidth: filled ? 6.5 : 2
            )
            .frame(width: 22, height: 22)
    }

    // MARK: - Notifications card

    private func notificationsCard(vm: ProfileViewModel) -> some View {
        Card(padding: 0) {
            VStack(spacing: 0) {
                if let s = vm.settings {
                    notifRow(
                        title: "Friends posting",
                        subtitle: "When friends log new meals",
                        isOn: Binding(
                            get: { s.friendFoodLogged },
                            set: { v in Task { await vm.toggle(\NotificationSettingsDTO.friendFoodLogged, to: v) } }
                        )
                    )
                    divider
                    notifRow(
                        title: "Friend goals",
                        subtitle: "When friends hit their goal",
                        isOn: Binding(
                            get: { s.friendGoalReached },
                            set: { v in Task { await vm.toggle(\NotificationSettingsDTO.friendGoalReached, to: v) } }
                        )
                    )
                    divider
                    notifRow(
                        title: "New friends",
                        subtitle: "When someone adds you back",
                        isOn: Binding(
                            get: { s.friendAdded },
                            set: { v in Task { await vm.toggle(\NotificationSettingsDTO.friendAdded, to: v) } }
                        )
                    )
                    divider
                    notifRow(
                        title: "Receive nudges",
                        subtitle: "Friend taps from across the table",
                        isOn: Binding(
                            get: { s.receiveNudges },
                            set: { v in Task { await vm.toggle(\NotificationSettingsDTO.receiveNudges, to: v) } }
                        )
                    )
                } else {
                    HStack {
                        ProgressView()
                        Text("Loading preferences…")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(EatoColor.textSecondary)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private func notifRow(title: String, subtitle: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
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
        .padding(.vertical, 14)
    }

    // MARK: - Sign out + footer

    private var signOutButton: some View {
        Button {
            Task { await session.signOut() }
        } label: {
            Text("Sign out")
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.danger)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(EatoColor.danger.opacity(0.08), in: .rect(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }

    private var footer: some View {
        Text("made with warmth · v\(appVersion)")
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .italic()
            .foregroundStyle(EatoColor.textTertiary)
            .frame(maxWidth: .infinity)
    }

    // MARK: - Helpers

    private func sectionTitle(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundStyle(EatoColor.textTertiary)
            .kerning(1.2)
            .padding(.horizontal, 28)
            .padding(.top, 4)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var divider: some View {
        Rectangle()
            .fill(EatoColor.divider.opacity(0.6))
            .frame(height: 1)
            .padding(.leading, 16)
    }

    private var initials: String {
        let name = session.currentUser?.name ?? session.currentUser?.email ?? "?"
        let parts = name.split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)) }
        return String(name.prefix(1)).uppercased()
    }

    private var displayName: String {
        session.currentUser?.name ?? "Friend"
    }

    private var subline: String {
        let friends = viewModel?.friendCount ?? 0
        let streak = viewModel?.streak?.currentStreak ?? 0
        let f = friends == 1 ? "1 friend" : "\(friends) friends"
        if streak > 0 {
            return "\(f) · \(streak)-day streak"
        }
        return f
    }

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
    }
}
