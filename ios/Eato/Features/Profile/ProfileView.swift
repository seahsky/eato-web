import SwiftUI

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: ProfileViewModel?
    @State private var showGoalSheet: Bool = false
    @State private var goalDraft: Double = 2000

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
            .navigationTitle("Me")
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
        .sheet(isPresented: $showGoalSheet) {
            goalEditorSheet
                .presentationDetents([.medium])
        }
    }

    @ViewBuilder
    private func content(_ vm: ProfileViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                avatarHeader
                accountCard(vm)
                preferencesCard(vm)
                appCard
                signOutButton
                Spacer(minLength: Spacing.xxl)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.top, Spacing.md)
        }
        .refreshable { await vm.load() }
    }

    private var avatarHeader: some View {
        VStack(spacing: Spacing.sm) {
            Avatar(initials: initials, size: .xl)
            Text(session.currentUser?.name ?? "")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text(session.currentUser?.email ?? "")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.md)
    }

    private func accountCard(_ vm: ProfileViewModel) -> some View {
        Card {
            VStack(spacing: 0) {
                row(
                    icon: "target",
                    label: "Daily goal",
                    value: session.currentUser?.profile.map { "\(Int($0.calorieGoal)) kcal" } ?? "—",
                    trailing: { Image(systemName: "chevron.right").foregroundStyle(EatoColor.textTertiary) },
                    onTap: {
                        goalDraft = session.currentUser?.profile?.calorieGoal ?? 2000
                        showGoalSheet = true
                    }
                )
                divider
                row(
                    icon: "flame.fill",
                    label: "TDEE",
                    value: session.currentUser?.profile.map { "\(Int($0.tdee)) kcal" } ?? "—"
                )
                divider
                row(
                    icon: "bolt.fill",
                    label: "Current streak",
                    value: vm.streak.map { "\($0.currentStreak) days" } ?? "—"
                )
            }
        }
    }

    private func preferencesCard(_ vm: ProfileViewModel) -> some View {
        Card {
            VStack(spacing: 0) {
                if let s = vm.settings {
                    toggleRow(
                        icon: "bell.fill",
                        label: "Friend logs a meal",
                        isOn: Binding(
                            get: { s.friendFoodLogged },
                            set: { new in Task { await vm.toggle(\NotificationSettingsDTO.friendFoodLogged, to: new) } }
                        )
                    )
                    divider
                    toggleRow(
                        icon: "checkmark.seal.fill",
                        label: "Friend hits goal",
                        isOn: Binding(
                            get: { s.friendGoalReached },
                            set: { new in Task { await vm.toggle(\NotificationSettingsDTO.friendGoalReached, to: new) } }
                        )
                    )
                    divider
                    toggleRow(
                        icon: "person.crop.circle.badge.plus",
                        label: "New friend added",
                        isOn: Binding(
                            get: { s.friendAdded },
                            set: { new in Task { await vm.toggle(\NotificationSettingsDTO.friendAdded, to: new) } }
                        )
                    )
                    divider
                    toggleRow(
                        icon: "hand.tap.fill",
                        label: "Receive nudges",
                        isOn: Binding(
                            get: { s.receiveNudges },
                            set: { new in Task { await vm.toggle(\NotificationSettingsDTO.receiveNudges, to: new) } }
                        )
                    )
                } else {
                    HStack {
                        ProgressView()
                        Text("Loading preferences…")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(EatoColor.textSecondary)
                    }
                    .padding(.vertical, Spacing.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var appCard: some View {
        Card {
            VStack(spacing: 0) {
                row(icon: "info.circle.fill", label: "Version", value: appVersion)
                divider
                row(
                    icon: "doc.text.fill",
                    label: "Privacy policy",
                    value: "",
                    trailing: { Image(systemName: "arrow.up.right.square").foregroundStyle(EatoColor.textTertiary) },
                    onTap: { /* TODO: open URL */ }
                )
            }
        }
    }

    private var signOutButton: some View {
        Button {
            Task { await session.signOut() }
        } label: {
            Text("Sign out")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.danger)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.md)
                .background(EatoColor.danger.opacity(0.08), in: .rect(cornerRadius: Radius.lg))
        }
        .buttonStyle(.plain)
        .softShadow(elevation: 2)
    }

    private var goalEditorSheet: some View {
        VStack(spacing: Spacing.lg) {
            Capsule()
                .fill(EatoColor.divider)
                .frame(width: 40, height: 4)
                .padding(.top, Spacing.sm)

            Text("Daily calorie goal")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)

            HStack {
                Button { goalDraft = max(1000, goalDraft - 50) } label: {
                    Image(systemName: "minus.circle.fill").font(.system(size: 32))
                }
                Spacer()
                Text("\(Int(goalDraft))")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
                    .monospacedDigit()
                Spacer()
                Button { goalDraft = min(10000, goalDraft + 50) } label: {
                    Image(systemName: "plus.circle.fill").font(.system(size: 32))
                }
            }
            .foregroundStyle(EatoColor.textPrimary)
            .padding(.horizontal, Spacing.xl)

            Text("kcal per day")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)

            Spacer()

            Button {
                Task {
                    await viewModel?.updateGoal(goalDraft)
                    showGoalSheet = false
                }
            } label: {
                Text(viewModel?.isSaving == true ? "Saving…" : "Save")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Spacing.md)
                    .foregroundStyle(EatoColor.accentContrast)
                    .background(EatoColor.terracotta, in: .rect(cornerRadius: Radius.lg))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xl)
        }
        .background(EatoColor.background)
    }

    // MARK: - Helpers

    private var initials: String {
        let name = session.currentUser?.name ?? session.currentUser?.email ?? "?"
        let parts = name.split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)) }
        return String(name.prefix(2))
    }

    private var appVersion: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
        return "\(v) (\(b))"
    }

    private var divider: some View {
        Rectangle()
            .fill(EatoColor.divider.opacity(0.5))
            .frame(height: 1)
            .padding(.leading, 40)
    }

    private func row<Trailing: View>(
        icon: String,
        label: String,
        value: String,
        @ViewBuilder trailing: () -> Trailing = { EmptyView() },
        onTap: (() -> Void)? = nil
    ) -> some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: Spacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(EatoColor.terracotta)
                    .frame(width: 24)
                Text(label)
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Spacer()
                if !value.isEmpty {
                    Text(value)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                        .monospacedDigit()
                }
                trailing()
            }
            .padding(.vertical, Spacing.sm)
        }
        .buttonStyle(.plain)
        .disabled(onTap == nil)
    }

    private func toggleRow(icon: String, label: String, isOn: Binding<Bool>) -> some View {
        HStack(spacing: Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(EatoColor.terracotta)
                .frame(width: 24)
            Text(label)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(EatoColor.terracotta)
        }
        .padding(.vertical, Spacing.sm)
    }
}
