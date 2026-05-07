import SwiftUI

struct DashboardView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: DashboardViewModel?
    @State private var filter: DiaryFilter = .all
    @State private var openedEntry: FoodEntryDTO?

    /// Tap on the compose bar bubbles up here so a host (MainTabView) can
    /// switch to the Log tab. Defaults to a no-op for previews.
    var onCompose: () -> Void = {}

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()
            content
            if let entry = openedEntry {
                PostcardOverlay(entry: entry) {
                    withAnimation(.spring(duration: 0.35)) {
                        openedEntry = nil
                    }
                }
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
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    ticketHeader
                        .padding(.horizontal, Spacing.lg)
                        .padding(.top, Spacing.md)

                    if let summary = vm.summary {
                        SummaryStrip(
                            consumed: Int(summary.totalCalories),
                            goal: Int(summary.calorieGoal),
                            weeklyTotal: vm.weekly.map { Int($0.totalCalories) },
                            weeklyGoal: vm.weekly.map { Int($0.calorieGoal * 7) }
                        )
                        .padding(.horizontal, Spacing.lg)
                    }

                    ComposeBar(action: onCompose)
                        .padding(.horizontal, Spacing.lg)

                    QuickChips(selection: $filter)

                    timelineOrEmpty(vm)
                        .padding(.horizontal, Spacing.lg)

                    Spacer(minLength: Spacing.xxl)
                }
            }
            .refreshable { await vm.refresh() }
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    @ViewBuilder
    private func timelineOrEmpty(_ vm: DashboardViewModel) -> some View {
        let entries = vm.filteredEntries(filter)
        if entries.isEmpty {
            emptyState(filter: filter)
                .padding(.top, Spacing.xl)
        } else {
            Timeline(entries: entries, onTap: { entry in
                withAnimation(.spring(duration: 0.4)) {
                    openedEntry = entry
                }
            })
        }
    }

    private func emptyState(filter: DiaryFilter) -> some View {
        let isFiltered = filter != .all
        return VStack(spacing: Spacing.md) {
            Text(isFiltered ? "🔎" : "📔")
                .font(.system(size: 56))
            Text(isFiltered
                 ? "No \(filter.label.lowercased()) yet"
                 : "Your diary is empty today")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text(isFiltered
                 ? "Try a different filter, or log something new."
                 : "Tap the compose bar above to add your first meal of the day.")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)

            if !isFiltered {
                Button(action: onCompose) {
                    Text("Log something")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.accentContrast)
                        .padding(.horizontal, Spacing.lg)
                        .padding(.vertical, Spacing.sm)
                        .background(EatoColor.terracotta, in: Capsule())
                }
                .buttonStyle(.plain)
                .padding(.top, Spacing.sm)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(Spacing.xl)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
        .softShadow(elevation: 6)
    }

    // Ticket-stub date header — small "Today" eyebrow + big date.
    private var ticketHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Today".uppercased())
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                Text(Self.dateString())
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
            }
            Spacer()
            ticketStub
        }
    }

    private var ticketStub: some View {
        VStack(spacing: 0) {
            Text("Diary")
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(0.8)
            Text(Self.dayNumber())
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.terracotta)
                .monospacedDigit()
            Text(Self.monthShort())
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(0.8)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            EatoColor.surfaceWarm,
            in: .rect(cornerRadius: Radius.sm)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Radius.sm)
                .strokeBorder(EatoColor.divider, style: StrokeStyle(lineWidth: 1, dash: [3, 2]))
        )
    }

    private static func dateString() -> String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: Date())
    }

    private static func dayNumber() -> String {
        let f = DateFormatter()
        f.dateFormat = "d"
        return f.string(from: Date())
    }

    private static func monthShort() -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM"
        return f.string(from: Date()).uppercased()
    }
}

/// Vertical timeline with a dotted rail behind monospaced timestamp dots.
private struct Timeline: View {
    let entries: [FoodEntryDTO]
    var onTap: (FoodEntryDTO) -> Void

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(entries.enumerated()), id: \.element.id) { idx, entry in
                row(entry: entry, isLast: idx == entries.count - 1)
            }
        }
    }

    private func row(entry: FoodEntryDTO, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: Spacing.md) {
            ZStack(alignment: .top) {
                if !isLast {
                    DottedRail()
                        .frame(width: 24)
                        .padding(.top, 36)
                }
                VStack(spacing: 4) {
                    RailDot()
                        .padding(.top, 18)
                    Text(timestamp(entry.consumedAt))
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                .frame(width: 44)
            }
            .frame(width: 44)

            EntryCard(entry: entry, onTap: { onTap(entry) })
                .padding(.bottom, isLast ? 0 : Spacing.md)
        }
    }

    private func timestamp(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }
}
