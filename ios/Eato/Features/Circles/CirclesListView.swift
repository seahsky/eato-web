import SwiftUI

/// Sub-tab embedded inside `FriendsView`. Lists the user's Meal Circles
/// and surfaces the entry points to create / open one.
struct CirclesListView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: CirclesViewModel?
    @State private var showingCreate: Bool = false
    @State private var openCircle: CircleListItemDTO?

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task {
            if viewModel == nil {
                viewModel = CirclesViewModel(api: session.api)
                await viewModel?.loadCircles()
            }
        }
        .sheet(isPresented: $showingCreate) {
            if let vm = viewModel {
                CircleCreateView(vm: vm) { _ in
                    showingCreate = false
                }
                .presentationDetents([.medium, .large])
            }
        }
        .navigationDestination(item: $openCircle) { circle in
            CircleDetailView(circleId: circle.id)
        }
    }

    @ViewBuilder
    private func content(_ vm: CirclesViewModel) -> some View {
        ScrollView {
            VStack(spacing: 12) {
                createTile

                if !vm.circles.isEmpty {
                    Text("YOUR CIRCLES · \(vm.circles.count)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .kerning(1.2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)
                        .padding(.top, 8)

                    ForEach(vm.circles) { circle in
                        Button { openCircle = circle } label: {
                            row(circle)
                        }
                        .buttonStyle(.plain)
                    }
                } else if vm.listState == .loaded {
                    emptyState.padding(.top, 40)
                }

                Spacer(minLength: 40)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
        .refreshable { await vm.loadCircles() }
    }

    private var createTile: some View {
        Button {
            showingCreate = true
        } label: {
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
                    Text("New circle")
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text("3–8 friends, shared meal moments")
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

    private func row(_ circle: CircleListItemDTO) -> some View {
        HStack(spacing: 12) {
            Text(circle.emoji)
                .font(.system(size: 28))
                .frame(width: 48, height: 48)
                .background(EatoColor.surfaceWarm, in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(circle.name)
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("\(circle.memberCount) member\(circle.memberCount == 1 ? "" : "s") · \(circle.role.lowercased().capitalized)")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(EatoColor.textTertiary)
        }
        .padding(12)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Text("🍽️").font(.system(size: 40))
            Text("No circles yet")
                .font(.system(size: 15, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
            Text("Create one and invite a few friends — circles share scheduled and on-demand meal moments.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
    }
}

/// Bottom-sheet form for creating a new circle. Defaults the timezone to
/// the device's current zone, which the user can edit before submitting.
struct CircleCreateView: View {
    @Bindable var vm: CirclesViewModel
    var onCreated: (CircleListItemDTO) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var emoji: String = "🍽️"
    @State private var timezone: String = TimeZone.current.identifier

    private static let emojiPalette = ["🍽️", "🥗", "🍳", "🍜", "🌮", "🍕", "🍰", "🍵", "🌱"]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Capsule()
                .fill(EatoColor.divider)
                .frame(width: 38, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

            Text("New circle")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)

            VStack(alignment: .leading, spacing: 8) {
                Text("NAME")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                TextField("Sunday family", text: $name)
                    .textFieldStyle(.plain)
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .padding(.horizontal, 14)
                    .frame(height: 48)
                    .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: 12))
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("EMOJI")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(Self.emojiPalette, id: \.self) { e in
                            Button { emoji = e } label: {
                                Text(e)
                                    .font(.system(size: 28))
                                    .frame(width: 48, height: 48)
                                    .background(
                                        emoji == e ? EatoColor.terracotta.opacity(0.18) : EatoColor.surfaceWarm,
                                        in: Circle()
                                    )
                                    .overlay(
                                        Circle().strokeBorder(
                                            emoji == e ? EatoColor.terracotta : .clear,
                                            lineWidth: 2
                                        )
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("TIMEZONE")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                Text(timezone)
                    .font(.system(size: 14, weight: .medium, design: .monospaced))
                    .foregroundStyle(EatoColor.textSecondary)
                    .padding(.horizontal, 14)
                    .frame(height: 44)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: 12))
                Text("Used to fire scheduled meal times. Defaults to this device's timezone.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }

            if let err = vm.lastError {
                Text(err)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.danger)
            }

            Spacer()

            Button {
                Task {
                    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty else { return }
                    if let created = await vm.createCircle(name: trimmed, emoji: emoji, timezone: timezone) {
                        onCreated(created)
                        dismiss()
                    }
                }
            } label: {
                Text(vm.isWorking ? "Creating…" : "Create circle")
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(EatoColor.terracotta, in: Capsule())
            }
            .buttonStyle(.plain)
            .disabled(vm.isWorking || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .opacity(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 28)
        .background(EatoColor.background)
    }
}
