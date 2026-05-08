import SwiftUI

struct DashboardView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: DashboardViewModel?
    @State private var openedEntry: FoodEntryDTO?
    @Namespace private var cardNamespace

    /// Tap on the AddCard or the footer chip bubbles up here so a host
    /// (MainTabView) can switch to the Add tab. Defaults to a no-op.
    var onCompose: () -> Void = {}
    var onOpenProfile: () -> Void = {}
    var onOpenHistory: () -> Void = {}

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()
            content
            if let entry = openedEntry {
                PostcardOverlay(
                    entry: entry,
                    namespace: cardNamespace,
                    onClose: {
                        withAnimation(.easeInOut(duration: 0.45)) {
                            openedEntry = nil
                        }
                    }
                )
                .zIndex(50)
            }
        }
        .task {
            if viewModel == nil {
                viewModel = DashboardViewModel(api: session.api)
            }
            await viewModel?.refresh()
        }
    }

    @ViewBuilder
    private var content: some View {
        if let vm = viewModel {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header(vm: vm)
                        .padding(.horizontal, 22)
                        .padding(.top, 6)

                    WeekStrip(
                        viewedDay: vm.viewedDay,
                        today: Date(),
                        loggedDays: vm.loggedDays,
                        onPick: { day in
                            Task { await vm.setViewedDay(day) }
                        }
                    )
                    .padding(.horizontal, 18)
                    .padding(.top, 16)

                    if !vm.isViewingToday {
                        backToTodayChip(vm)
                            .padding(.horizontal, 22)
                            .padding(.top, 14)
                    }

                    if vm.isViewingToday && !vm.entriesNewestFirst.isEmpty {
                        todayHint
                            .padding(.horizontal, 22)
                            .padding(.top, 18)
                    }

                    grid(vm: vm)
                        .padding(.horizontal, 18)
                        .padding(.top, 20)

                    if !vm.entriesNewestFirst.isEmpty, let summary = vm.summary {
                        SummaryStrip(
                            consumed: Int(summary.totalCalories),
                            goal: Int(summary.calorieGoal),
                            dateLabel: vm.isViewingToday ? nil : monoDate(vm.viewedDay),
                            isToday: vm.isViewingToday
                        )
                        .padding(.horizontal, 20)
                        .padding(.top, 26)
                    }

                    if vm.isViewingToday {
                        historyFooter
                            .padding(.horizontal, 20)
                            .padding(.top, 14)
                    }

                    Spacer(minLength: 80)
                }
            }
            .refreshable { await vm.refresh() }
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: - Header

    @ViewBuilder
    private func header(vm: DashboardViewModel) -> some View {
        let isFuture = vm.viewedDay > Date().endOfToday
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(eyebrow(for: vm))
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundStyle(vm.isViewingToday ? EatoColor.textTertiary : EatoColor.terracotta)
                    .kerning(1.6)
                Text(headline(for: vm))
                    .font(.system(size: 42, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .kerning(-1.2)
                    .lineSpacing(-2)
                Text(subline(for: vm, isFuture: isFuture))
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
            Spacer(minLength: 0)
            avatar
        }
    }

    private var avatar: some View {
        Button(action: onOpenProfile) {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [EatoColor.terracottaSoft, EatoColor.terracotta],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 40, height: 40)
                .overlay(
                    Text("M")
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                )
                .softShadow(elevation: 2)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Back-to-today chip + today hint

    private func backToTodayChip(_ vm: DashboardViewModel) -> some View {
        HStack(spacing: 8) {
            Button {
                Task { await vm.goToToday() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 11, weight: .bold))
                    Text("Back to today")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                }
                .foregroundStyle(EatoColor.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(EatoColor.surface, in: Capsule())
                .overlay(Capsule().strokeBorder(EatoColor.divider, lineWidth: 1))
                .softShadow(elevation: 2)
            }
            .buttonStyle(.plain)
            Spacer()
        }
    }

    private var todayHint: some View {
        HStack(spacing: 8) {
            Image(systemName: "hand.tap")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(EatoColor.textTertiary)
            Text("tap any card to pick it up")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .italic()
                .foregroundStyle(EatoColor.textTertiary)
            Spacer()
        }
    }

    // MARK: - Grid

    @ViewBuilder
    private func grid(vm: DashboardViewModel) -> some View {
        let entries = vm.entriesNewestFirst
        let isFuture = vm.viewedDay > Date().endOfToday

        if entries.isEmpty && !vm.isViewingToday {
            EmptyDayCard(isFuture: isFuture, monoLabel: monoDate(vm.viewedDay))
        } else {
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3),
                spacing: 10
            ) {
                if vm.isViewingToday {
                    AddCard(onTap: onCompose)
                }
                ForEach(Array(entries.enumerated()), id: \.element.id) { idx, entry in
                    StackCard(
                        entry: entry,
                        index: idx + (vm.isViewingToday ? 1 : 0),
                        namespace: cardNamespace,
                        hidden: openedEntry?.id == entry.id,
                        onTap: {
                            withAnimation(.timingCurve(0.22, 0.61, 0.36, 1, duration: 0.55)) {
                                openedEntry = entry
                            }
                        }
                    )
                }
            }
        }
    }

    // MARK: - History footer

    private var historyFooter: some View {
        Button(action: onOpenHistory) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(EatoColor.surfaceWarm)
                        .frame(width: 34, height: 34)
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(EatoColor.textPrimary)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("LOOKING BACK")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundStyle(EatoColor.textTertiary)
                        .kerning(1.2)
                    Text("Browse full diary")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(EatoColor.surface, in: .rect(cornerRadius: 18))
            .softShadow(elevation: 2)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Header copy

    private func eyebrow(for vm: DashboardViewModel) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        let base = f.string(from: vm.viewedDay).uppercased()
        return vm.isViewingToday ? base : "\(base) · PAST"
    }

    private func headline(for vm: DashboardViewModel) -> String {
        if vm.isViewingToday { return "Today" }
        let f = DateFormatter()
        f.dateFormat = "EEEE"
        // "Sat" + "day" pattern is the design's compact label.
        return f.string(from: vm.viewedDay)
    }

    private func subline(for vm: DashboardViewModel, isFuture: Bool) -> String {
        let entries = vm.entriesNewestFirst
        if entries.isEmpty {
            return isFuture ? "Not yet." : "Nothing logged."
        }
        let kcal = Int(vm.summary?.totalCalories ?? 0)
        let n = entries.count
        return "\(n) moment\(n == 1 ? "" : "s") · \(kcal) kcal"
    }

    private func monoDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f.string(from: date).uppercased()
    }
}

private extension Date {
    /// End-of-day in the user's local calendar — used to decide whether a day
    /// is "future" relative to now.
    var endOfToday: Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        return cal.date(bySettingHour: 23, minute: 59, second: 59, of: self) ?? self
    }
}

// MARK: - Empty day card (past/future)

private struct EmptyDayCard: View {
    let isFuture: Bool
    let monoLabel: String

    var body: some View {
        VStack(spacing: 8) {
            Text(isFuture ? "Hasn't happened yet" : "A quiet day")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
            Text(isFuture ? "The page is still blank." : "Nothing was written on this page.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .padding(.horizontal, 22)
        .background(EatoColor.surface, in: .rect(cornerRadius: 22))
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .strokeBorder(EatoColor.divider, style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
        )
    }
}
