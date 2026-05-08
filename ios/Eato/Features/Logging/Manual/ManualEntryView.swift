import SwiftUI

struct ManualEntryView: View {
    @State private var name: String = ""
    @State private var pendingName: String?
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
        .navigationDestination(item: $pendingName) { name in
            ManualPhotoThenLog(name: name, onDismiss: onDismiss)
        }
    }

    private func continueIfReady() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        pendingName = trimmed
    }
}

/// Two-step nav after the user names a manual entry: capture a photo, then log.
/// Owning a private `seed` here scopes the LogEntryView destination to the photo
/// view's nav context, so SwiftUI pushes LogEntryView on top of PhotoCaptureStep
/// (instead of replacing it).
private struct ManualPhotoThenLog: View {
    let name: String
    let onDismiss: () -> Void
    @State private var seed: LogEntrySeed?

    var body: some View {
        PhotoCaptureStep(title: "Snap your \(name)") { url in
            var s = LogEntrySeed(manual: name)
            s.imageUrl = url
            seed = s
        }
        .navigationDestination(item: $seed) { seed in
            LogEntryView(seed: seed, onLogged: { _ in onDismiss() })
        }
    }
}
