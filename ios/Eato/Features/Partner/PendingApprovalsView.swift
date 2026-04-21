import SwiftUI

@Observable
@MainActor
final class PendingApprovalsViewModel {
    private(set) var entries: [PendingEntryDTO] = []
    private(set) var isLoading: Bool = false
    private(set) var errorMessage: String?

    private let api: APIClient

    init(api: APIClient) { self.api = api }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        do {
            entries = try await api.send(PartnerAPI.pendingApprovals)
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func approve(_ entry: PendingEntryDTO) async {
        _ = try? await api.send(PartnerAPI.approve(entry.id))
        entries.removeAll { $0.id == entry.id }
    }

    func reject(_ entry: PendingEntryDTO, note: String?) async {
        _ = try? await api.send(PartnerAPI.reject(entry.id, note: note))
        entries.removeAll { $0.id == entry.id }
    }
}

struct PendingApprovalsView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: PendingApprovalsViewModel?
    @State private var rejectingEntry: PendingEntryDTO?
    @State private var rejectNote: String = ""

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = PendingApprovalsViewModel(api: session.api) }
            await viewModel?.load()
        }
        .navigationTitle("Approvals")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Reject entry?", isPresented: Binding(
            get: { rejectingEntry != nil },
            set: { if !$0 { rejectingEntry = nil } }
        )) {
            TextField("Optional note", text: $rejectNote)
            Button("Cancel", role: .cancel) { rejectingEntry = nil }
            Button("Reject", role: .destructive) {
                if let entry = rejectingEntry {
                    Task {
                        await viewModel?.reject(entry, note: rejectNote.isEmpty ? nil : rejectNote)
                        rejectingEntry = nil
                        rejectNote = ""
                    }
                }
            }
        } message: {
            if let entry = rejectingEntry {
                Text("Reject '\(entry.foodName)'?")
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: PendingApprovalsViewModel) -> some View {
        if vm.entries.isEmpty {
            if vm.isLoading {
                ProgressView()
            } else if let error = vm.errorMessage {
                EmptyState(systemImage: "exclamationmark.triangle", title: "Couldn't load", message: error)
            } else {
                EmptyState(
                    systemImage: "checkmark.circle",
                    title: "All caught up",
                    message: "No partner-logged entries waiting for review."
                )
            }
        } else {
            List {
                ForEach(vm.entries) { entry in
                    ApprovalRow(
                        entry: entry,
                        onApprove: { Task { await vm.approve(entry) } },
                        onRejectRequested: { rejectingEntry = entry }
                    )
                }
            }
            .listStyle(.plain)
            .refreshable { await vm.load() }
        }
    }
}

private struct ApprovalRow: View {
    let entry: PendingEntryDTO
    let onApprove: () -> Void
    let onRejectRequested: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            VStack(alignment: .leading, spacing: Spacing.xxs) {
                Text(entry.foodName).font(Typography.bodyMedium)
                Text("\(Int(entry.calories)) kcal · logged by \(entry.loggedByName ?? "partner")")
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.textSecondary)
            }
            HStack(spacing: Spacing.sm) {
                Button(action: onRejectRequested) {
                    Text("Reject")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(EatoColor.danger)

                Button(action: onApprove) {
                    Text("Approve")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(EatoColor.accent)
            }
        }
        .padding(.vertical, Spacing.sm)
    }
}
