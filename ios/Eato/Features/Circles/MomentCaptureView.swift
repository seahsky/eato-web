import SwiftUI
import PhotosUI
import UIKit

/// Full-screen plate-photo capture for a meal moment.
///
/// Flow: pick a photo → upload to R2 + run AI nutrition fill → review the
/// pre-filled estimate → submit, which creates a FoodEntry on the backend
/// and fills the moment slot.
struct MomentCaptureView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    let circleId: String
    let momentId: String
    let label: String
    let circleEmoji: String
    var onSubmitted: () -> Void

    enum Stage: Equatable {
        case picking
        case analysing
        case review(estimate: NutritionEstimate)
        case submitting
        case failed(String)
    }

    /// Aggregated nutrition from analyzePhoto's matched items.
    struct NutritionEstimate: Equatable {
        var name: String
        var calories: Double
        var protein: Double
        var carbs: Double
        var fat: Double
        var fatSecretId: String?
    }

    @State private var stage: Stage = .picking
    @State private var photoUrl: String?
    @State private var pickedImage: UIImage?
    @State private var pickerItem: PhotosPickerItem?
    @State private var showingCamera = false
    @State private var note: String = ""

    var body: some View {
        ZStack {
            EatoColor.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                Group {
                    switch stage {
                    case .picking:
                        pickingStep
                    case .analysing, .submitting:
                        progressStep(stage: stage)
                    case .review(let est):
                        reviewStep(estimate: est)
                    case .failed(let msg):
                        failedStep(message: msg)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .onChange(of: pickerItem) { _, new in
            Task { await loadFromPicker(new) }
        }
        .fullScreenCover(isPresented: $showingCamera) {
            CameraCapture { image in
                pickedImage = image
                Task { await analyse(image: image) }
            }
            .ignoresSafeArea()
        }
    }

    private var header: some View {
        HStack(spacing: 14) {
            Text(circleEmoji)
                .font(.system(size: 32))
                .frame(width: 48, height: 48)
                .background(EatoColor.surfaceWarm, in: Circle())
            VStack(alignment: .leading, spacing: 0) {
                Text(label)
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("snap your plate")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(EatoColor.textTertiary)
                    .frame(width: 36, height: 36)
                    .background(EatoColor.surfaceWarm, in: Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(EatoColor.surface)
    }

    // MARK: - Stages

    @ViewBuilder
    private var pickingStep: some View {
        VStack(spacing: 16) {
            preview
                .padding(.horizontal, 20)
                .padding(.top, 16)
            VStack(spacing: 10) {
                Button {
                    showingCamera = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "camera.fill")
                        Text("Take photo")
                    }
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(EatoColor.terracotta, in: Capsule())
                }
                .buttonStyle(.plain)

                PhotosPicker(selection: $pickerItem, matching: .images) {
                    HStack(spacing: 10) {
                        Image(systemName: "photo.on.rectangle")
                        Text("From library")
                    }
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .background(EatoColor.surface, in: Capsule())
                    .overlay(Capsule().strokeBorder(EatoColor.terracotta.opacity(0.4), lineWidth: 1))
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
    }

    @ViewBuilder
    private var preview: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(EatoColor.surfaceWarm)
                .frame(maxWidth: .infinity)
                .frame(height: 320)

            if let img = pickedImage {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity)
                    .frame(height: 320)
                    .clipShape(.rect(cornerRadius: 20))
            } else {
                VStack(spacing: 8) {
                    Image(systemName: "fork.knife.circle.fill")
                        .font(.system(size: 44, weight: .heavy))
                        .foregroundStyle(EatoColor.terracotta.opacity(0.6))
                    Text("Snap your plate to join the moment")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
            }
        }
    }

    @ViewBuilder
    private func progressStep(stage: Stage) -> some View {
        VStack(spacing: 14) {
            ProgressView().tint(EatoColor.terracotta)
            Text(stage == .analysing ? "Reading your plate…" : "Logging…")
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func reviewStep(estimate: NutritionEstimate) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                preview
                    .padding(.horizontal, 20)

                VStack(alignment: .leading, spacing: 10) {
                    Text("AI ESTIMATE")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                        .kerning(1.2)
                    Text(estimate.name)
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    HStack(spacing: 8) {
                        macroPill(label: "kcal", value: Int(estimate.calories.rounded()))
                        macroPill(label: "P", value: Int(estimate.protein.rounded()))
                        macroPill(label: "C", value: Int(estimate.carbs.rounded()))
                        macroPill(label: "F", value: Int(estimate.fat.rounded()))
                    }
                    Text("Tap retake if it's way off — otherwise post it.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(EatoColor.surface, in: .rect(cornerRadius: 16))
                .softShadow(elevation: 2)
                .padding(.horizontal, 20)

                TextField("a quick note (optional)", text: $note, axis: .vertical)
                    .textFieldStyle(.plain)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .padding(14)
                    .background(EatoColor.surface, in: .rect(cornerRadius: 14))
                    .softShadow(elevation: 1)
                    .padding(.horizontal, 20)
                    .lineLimit(2...4)

                HStack(spacing: 10) {
                    Button {
                        stage = .picking
                        pickedImage = nil
                        photoUrl = nil
                    } label: {
                        Text("Retake")
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.terracotta)
                            .frame(maxWidth: .infinity, minHeight: 50)
                            .background(EatoColor.surface, in: Capsule())
                            .overlay(Capsule().strokeBorder(EatoColor.terracotta.opacity(0.4), lineWidth: 1))
                    }
                    .buttonStyle(.plain)

                    Button {
                        Task { await submit(estimate: estimate) }
                    } label: {
                        Text("Post to circle")
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: 50)
                            .background(EatoColor.terracotta, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
            }
        }
    }

    @ViewBuilder
    private func failedStep(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 36))
                .foregroundStyle(EatoColor.danger)
            Text(message)
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button { stage = .picking } label: {
                Text("Try again")
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(EatoColor.terracotta, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(.top, 60)
    }

    private func macroPill(label: String, value: Int) -> some View {
        HStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: 16, weight: .heavy, design: .monospaced))
                .foregroundStyle(EatoColor.textPrimary)
                .monospacedDigit()
            Text(label)
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(EatoColor.surfaceWarm, in: Capsule())
    }

    // MARK: - Actions

    private func loadFromPicker(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data) else {
                stage = .failed("Couldn't read that image.")
                return
            }
            pickedImage = image
            await analyse(image: image)
        } catch {
            stage = .failed(error.localizedDescription)
        }
    }

    private func analyse(image: UIImage) async {
        stage = .analysing
        photoUrl = nil

        // Upload first so we have the public URL for the moment slot.
        if let jpeg = image.jpegData(compressionQuality: 0.85) {
            let uploader = R2Uploader(api: session.api)
            photoUrl = try? await uploader.upload(imageData: jpeg)
        }

        guard let base64 = compressBase64(image) else {
            stage = .failed("Couldn't read that image.")
            return
        }
        do {
            let items = try await session.api.send(FoodAPI.analyzePhoto(.init(image: base64)))
            stage = .review(estimate: aggregate(items: items))
        } catch let apiError as APIError {
            stage = .failed(apiError.errorDescription ?? "AI couldn't read that plate")
        } catch {
            stage = .failed(error.localizedDescription)
        }
    }

    private func submit(estimate: NutritionEstimate) async {
        stage = .submitting
        let entry = MomentSubmitEntry(
            name: estimate.name,
            brand: nil,
            imageUrl: photoUrl,
            calories: estimate.calories,
            protein: estimate.protein,
            carbs: estimate.carbs,
            fat: estimate.fat,
            fiber: nil,
            sugar: nil,
            sodium: nil,
            servingSize: 1,
            servingUnit: "plate",
            mood: nil,
            note: note.isEmpty ? nil : note,
            isManualEntry: false,
            dataSource: estimate.fatSecretId != nil ? "FATSECRET" : "MANUAL",
            fatSecretId: estimate.fatSecretId
        )
        do {
            _ = try await session.api.send(MealMomentAPI.submit(.init(momentId: momentId, entry: entry)))
            onSubmitted()
            dismiss()
        } catch let apiError as APIError {
            stage = .failed(apiError.errorDescription ?? "Couldn't post to the circle")
        } catch {
            stage = .failed(error.localizedDescription)
        }
    }

    /// Aggregate all matched items into a single line with summed totals.
    /// First matched product wins the FatSecret id (used as the dataSource hint).
    private func aggregate(items: [AnalyzedItem]) -> NutritionEstimate {
        var calories = 0.0, protein = 0.0, carbs = 0.0, fat = 0.0
        var names: [String] = []
        var firstFatSecretId: String?

        for item in items {
            names.append(item.query)
            if let p = item.products.first {
                let cals = p.servingCalories ?? p.caloriesPer100g ?? 0
                let pro = p.servingProtein ?? p.proteinPer100g ?? 0
                let car = p.servingCarbs ?? p.carbsPer100g ?? 0
                let fa = p.servingFat ?? p.fatPer100g ?? 0
                calories += cals
                protein += pro
                carbs += car
                fat += fa
                if firstFatSecretId == nil, let id = p.fatSecretId {
                    firstFatSecretId = id
                }
            }
        }

        let name = names.isEmpty ? "Meal" : names.prefix(3).joined(separator: ", ")
        return .init(
            name: name,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            fatSecretId: firstFatSecretId
        )
    }

    /// Target ~1.2 MB JPEG so we stay under the backend's 1.5 MB cap.
    private func compressBase64(_ image: UIImage) -> String? {
        var quality: CGFloat = 0.85
        while quality > 0.1 {
            if let data = image.jpegData(compressionQuality: quality), data.count < 1_200_000 {
                return data.base64EncodedString()
            }
            quality -= 0.1
        }
        return image.jpegData(compressionQuality: 0.1)?.base64EncodedString()
    }
}

// MARK: - Camera capture wrapper (UIImagePicker)

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
