import SwiftUI

@Observable
@MainActor
final class PetViewModel {
    private(set) var ownHealth: PetHealthDTO?
    private(set) var partnerHealth: PetHealthDTO?
    private(set) var interactions: [PetInteractionDTO] = []
    private(set) var isLoading: Bool = false
    private(set) var interactionError: String?

    private let api: APIClient

    init(api: APIClient) { self.api = api }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        async let own = fetch(PetAPI.getHealth)
        async let partner = fetch(PetAPI.partnerHealth)
        async let received = fetch(PetAPI.interactions)
        let (o, p, r) = await (own, partner, received)
        if case .success(let value) = o { ownHealth = value }
        if case .success(let value) = p { partnerHealth = value ?? nil }
        if case .success(let value) = r { interactions = value }
    }

    func send(_ type: PetInteractionType) async {
        interactionError = nil
        do {
            _ = try await api.send(PetAPI.sendInteraction(type))
        } catch let apiError as APIError {
            interactionError = apiError.errorDescription
        } catch {
            interactionError = error.localizedDescription
        }
    }

    private func fetch<R>(_ endpoint: Endpoint<R>) async -> Result<R, APIError> {
        do { return .success(try await api.send(endpoint)) }
        catch let apiError as APIError { return .failure(apiError) }
        catch { return .failure(.server(message: error.localizedDescription)) }
    }
}

struct PetView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: PetViewModel?

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = PetViewModel(api: session.api) }
            await viewModel?.load()
        }
        .navigationTitle("Pets")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(_ vm: PetViewModel) -> some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                if let own = vm.ownHealth {
                    PetCard(title: "You", health: own)
                }
                if let partner = vm.partnerHealth {
                    PetCard(title: session.currentUser?.partner?.name ?? "Partner", health: partner)
                    interactionStrip(vm: vm)
                }
                if !vm.interactions.isEmpty {
                    recentInteractions(vm.interactions)
                }
            }
            .padding(Spacing.lg)
        }
        .refreshable { await vm.load() }
    }

    private func interactionStrip(vm: PetViewModel) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Send a hello").font(Typography.titleSmall)
            HStack(spacing: Spacing.sm) {
                ForEach(PetInteractionType.allCases, id: \.self) { type in
                    Button {
                        Task { await vm.send(type) }
                    } label: {
                        VStack(spacing: Spacing.xxs) {
                            Text(type.emoji).font(.system(size: 32))
                            Text(type.label).font(Typography.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.md)
                        .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
                    }
                    .buttonStyle(.plain)
                }
            }
            if let error = vm.interactionError {
                Text(error).font(Typography.caption).foregroundStyle(EatoColor.warning)
            }
        }
    }

    private func recentInteractions(_ items: [PetInteractionDTO]) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Recent from your partner").font(Typography.titleSmall)
            ForEach(items) { item in
                HStack {
                    Text(PetInteractionType(rawValue: item.type)?.emoji ?? "👋")
                        .font(.system(size: 22))
                    Text(item.fromUser?.name ?? "Partner")
                    Spacer()
                    Text(item.createdAt.formatted(.relative(presentation: .named)))
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
                .padding(Spacing.md)
                .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
            }
        }
    }
}

private struct PetCard: View {
    let title: String
    let health: PetHealthDTO

    var body: some View {
        Card {
            HStack(spacing: Spacing.md) {
                Text(health.healthState.emoji).font(.system(size: 48))
                VStack(alignment: .leading, spacing: Spacing.xxs) {
                    Text(title).font(Typography.titleSmall)
                    Text(health.healthState.label)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                    Text("\(health.daysOnGoal) of 7 days on goal")
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
                Spacer()
            }
        }
    }
}
