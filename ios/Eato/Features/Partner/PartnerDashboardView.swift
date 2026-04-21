import SwiftUI

struct PartnerDashboardView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: PartnerDashboardViewModel?

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = PartnerDashboardViewModel(api: session.api) }
            await viewModel?.refresh()
        }
    }

    @ViewBuilder
    private func content(_ vm: PartnerDashboardViewModel) -> some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                header(vm)

                if let summary = vm.partnerSummary {
                    partnerCard(summary: summary)
                } else if case .failed(let error) = vm.state {
                    Text(error.errorDescription ?? "")
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.danger)
                }

                NavigationLink { PendingApprovalsView() } label: {
                    pendingApprovalsCard(vm: vm)
                }
                .buttonStyle(.plain)

                PrimaryButton("Send a nudge", icon: Image(systemName: "bell"), isLoading: vm.sendingNudge) {
                    Task { await vm.sendNudge() }
                }

                if let message = vm.lastMessage {
                    Text(message)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
            }
            .padding(Spacing.lg)
        }
        .refreshable { await vm.refresh() }
    }

    private func header(_ vm: PartnerDashboardViewModel) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(session.currentUser?.partner?.name ?? "Partner")
                .font(Typography.titleLarge)
            Text("Today")
                .font(Typography.caption)
                .foregroundStyle(EatoColor.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func partnerCard(summary: DailySummaryDTO) -> some View {
        Card {
            VStack(alignment: .leading, spacing: Spacing.md) {
                HStack {
                    Text("\(Int(summary.totalCalories)) kcal")
                        .font(Typography.titleMedium)
                        .monospacedDigit()
                    Spacer()
                    Text("of \(Int(summary.calorieGoal))")
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4).fill(EatoColor.divider)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(EatoColor.accent)
                            .frame(
                                width: geo.size.width
                                    * min(1, summary.totalCalories / max(1, summary.calorieGoal))
                            )
                    }
                }
                .frame(height: 8)
            }
        }
    }

    private func pendingApprovalsCard(vm: PartnerDashboardViewModel) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: Spacing.xxs) {
                Text("Pending approvals").font(Typography.titleSmall)
                Text(vm.pendingCount == 0 ? "Nothing to review" : "\(vm.pendingCount) to review")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
            }
            Spacer()
            if vm.pendingCount > 0 {
                Text("\(vm.pendingCount)")
                    .font(Typography.titleSmall)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, Spacing.xxs)
                    .background(EatoColor.accent, in: .rect(cornerRadius: Radius.pill))
                    .foregroundStyle(EatoColor.accentContrast)
            }
            Image(systemName: "chevron.right").foregroundStyle(EatoColor.textSecondary)
        }
        .padding(Spacing.lg)
        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.lg))
    }
}
