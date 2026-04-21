import SwiftUI

struct ManualEntryView: View {
    @State private var name: String = ""
    @State private var seed: LogEntrySeed?
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            Text("Name your meal").font(Typography.titleSmall)
            TextField("e.g. Grandma's pasta", text: $name)
                .textFieldStyle(.roundedBorder)
                .submitLabel(.next)
                .onSubmit(continueIfReady)
            PrimaryButton("Continue", action: continueIfReady)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            Spacer()
        }
        .padding(Spacing.lg)
        .navigationTitle("Manual entry")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $seed) { seed in
            LogEntryView(seed: seed, onLogged: { _ in onDismiss() })
        }
    }

    private func continueIfReady() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        seed = LogEntrySeed(manual: trimmed)
    }
}

