import SwiftUI
import PhotosUI
import UIKit

/// Mandatory photo step in the Search / Manual / Barcode logging flows.
/// User picks a photo (camera or library), it's compressed and uploaded to R2,
/// then `onComplete` fires with the public R2 URL the caller should attach to
/// the new `FoodEntry.imageUrl`. There is no skip path.
struct PhotoCaptureStep: View {
    @Environment(SessionStore.self) private var session
    @State private var pickerItem: PhotosPickerItem?
    @State private var pickedImage: UIImage?
    @State private var isUploading = false
    @State private var errorMessage: String?
    @State private var showingCamera = false

    let title: String
    let subtitle: String
    let onComplete: (String) -> Void

    init(
        title: String = "Add a photo",
        subtitle: String = "Just a quick snap of the meal — it's how the diary stays photo-keyed.",
        onComplete: @escaping (String) -> Void
    ) {
        self.title = title
        self.subtitle = subtitle
        self.onComplete = onComplete
    }

    var body: some View {
        VStack(spacing: Spacing.lg) {
            preview
            actionButtons
            if let errorMessage {
                Text(errorMessage)
                    .font(Typography.caption)
                    .foregroundStyle(EatoColor.danger)
                    .multilineTextAlignment(.center)
            }
            Spacer()
        }
        .padding(Spacing.lg)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .photosPicker(isPresented: .constant(false), selection: $pickerItem)
        .onChange(of: pickerItem) { _, new in
            Task { await loadFromPicker(new) }
        }
        .fullScreenCover(isPresented: $showingCamera) {
            CameraCapture { image in
                pickedImage = image
                Task { await uploadAndComplete(image) }
            }
            .ignoresSafeArea()
        }
    }

    // MARK: - Subviews

    @ViewBuilder
    private var preview: some View {
        ZStack {
            RoundedRectangle(cornerRadius: Radius.lg)
                .fill(EatoColor.surface)
                .frame(maxWidth: .infinity)
                .frame(height: 280)
                .softShadow(elevation: 4)

            if isUploading {
                VStack(spacing: Spacing.sm) {
                    ProgressView().tint(EatoColor.terracotta)
                    Text("Saving photo…")
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                }
            } else if let image = pickedImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity)
                    .frame(height: 280)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.lg))
            } else {
                VStack(spacing: Spacing.sm) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundStyle(EatoColor.terracotta)
                    Text(subtitle)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.lg)
                }
            }
        }
    }

    @ViewBuilder
    private var actionButtons: some View {
        VStack(spacing: Spacing.sm) {
            Button {
                showingCamera = true
            } label: {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "camera.fill")
                    Text("Take photo").font(Typography.titleSmall)
                }
                .frame(maxWidth: .infinity, minHeight: 50)
                .foregroundStyle(EatoColor.accentContrast)
                .background(EatoColor.terracotta, in: .rect(cornerRadius: Radius.md))
            }
            .disabled(isUploading)

            PhotosPicker(selection: $pickerItem, matching: .images) {
                HStack(spacing: Spacing.sm) {
                    Image(systemName: "photo.on.rectangle")
                    Text("Choose from library").font(Typography.titleSmall)
                }
                .frame(maxWidth: .infinity, minHeight: 50)
                .foregroundStyle(EatoColor.terracotta)
                .background(
                    EatoColor.surface,
                    in: .rect(cornerRadius: Radius.md)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.md)
                        .strokeBorder(EatoColor.terracotta.opacity(0.4), lineWidth: 1)
                )
            }
            .disabled(isUploading)
        }
    }

    // MARK: - Actions

    private func loadFromPicker(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data) else {
                errorMessage = "Couldn't read that image."
                return
            }
            pickedImage = image
            await uploadAndComplete(image)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func uploadAndComplete(_ image: UIImage) async {
        errorMessage = nil
        isUploading = true
        defer { isUploading = false }
        guard let data = compress(image) else {
            errorMessage = "Couldn't compress that image."
            return
        }
        do {
            let uploader = R2Uploader(api: session.api)
            let publicUrl = try await uploader.upload(imageData: data)
            onComplete(publicUrl)
        } catch let error as R2UploadError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Target ~1 MB JPEG. R2 has no hard cap but smaller is faster on mobile.
    private func compress(_ image: UIImage) -> Data? {
        var quality: CGFloat = 0.85
        while quality > 0.2 {
            if let data = image.jpegData(compressionQuality: quality), data.count < 1_000_000 {
                return data
            }
            quality -= 0.1
        }
        return image.jpegData(compressionQuality: 0.2)
    }
}

// MARK: - Camera capture wrapper

private struct CameraCapture: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.delegate = context.coordinator
        picker.allowsEditing = false
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onCapture: onCapture) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onCapture: (UIImage) -> Void
        init(onCapture: @escaping (UIImage) -> Void) { self.onCapture = onCapture }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            picker.dismiss(animated: true)
            if let image = info[.originalImage] as? UIImage {
                onCapture(image)
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}
