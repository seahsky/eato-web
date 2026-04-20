import SwiftUI

struct PartnerLinkView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: PartnerLinkViewModel?

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = PartnerLinkViewModel(api: session.api) { [session] in
                    await session.loadMe()
                }
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: PartnerLinkViewModel) -> some View {
        @Bindable var vm = vm
        ScrollView {
            VStack(spacing: Spacing.xl) {
                EmptyState(
                    systemImage: "person.2",
                    title: "Link with a partner",
                    message: "Share daily progress and log meals for each other."
                )

                Card {
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Share your code").font(Typography.titleSmall)
                        Text("Send this 6-character code to your partner. It expires in 24 hours.")
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.textSecondary)
                        if let code = vm.myCode?.code {
                            Text(code)
                                .font(.system(size: 36, weight: .heavy, design: .monospaced))
                                .tracking(4)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, Spacing.md)
                                .background(EatoColor.accent.opacity(0.1), in: .rect(cornerRadius: Radius.md))
                        }
                        PrimaryButton(vm.myCode == nil ? "Generate code" : "Generate new code", isLoading: vm.isGenerating) {
                            Task { await vm.generateCode() }
                        }
                    }
                }

                Card {
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        Text("Enter a partner's code").font(Typography.titleSmall)
                        TextField("ABC123", text: $vm.codeEntry)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .font(.system(.title2, design: .monospaced))
                            .multilineTextAlignment(.center)
                            .padding(Spacing.md)
                            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
                        PrimaryButton("Link", isLoading: vm.isLinking) {
                            Task { await vm.linkWithEnteredCode() }
                        }
                        .disabled(vm.codeEntry.count != 6)
                    }
                }

                if let errorMessage = vm.errorMessage {
                    Text(errorMessage)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.danger)
                }
            }
            .padding(Spacing.lg)
        }
    }
}
