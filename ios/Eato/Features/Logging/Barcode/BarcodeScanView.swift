import SwiftUI
import VisionKit

struct BarcodeScanView: View {
    @Environment(SessionStore.self) private var session
    @State private var resolvedProduct: ResolvedProduct?
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    let onDismiss: () -> Void

    var body: some View {
        ZStack {
            if DataScannerViewController.isSupported && DataScannerViewController.isAvailable {
                BarcodeScannerRepresentable { code in
                    Task { await resolve(code: code) }
                }
                .ignoresSafeArea()
            } else {
                EmptyState(
                    systemImage: "barcode.viewfinder",
                    title: "Barcode scanning unavailable",
                    message: "This device does not support live barcode scanning."
                )
            }

            VStack {
                Spacer()
                if isLoading {
                    ProgressView("Looking up barcode…")
                        .padding(Spacing.md)
                        .background(.ultraThinMaterial, in: .rect(cornerRadius: Radius.md))
                }
                if let errorMessage {
                    Text(errorMessage)
                        .font(Typography.caption)
                        .foregroundStyle(EatoColor.accentContrast)
                        .padding(Spacing.md)
                        .background(EatoColor.danger, in: .rect(cornerRadius: Radius.md))
                        .padding(.bottom, Spacing.xl)
                }
            }
        }
        .navigationTitle("Scan barcode")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $resolvedProduct) { ref in
            BarcodePhotoThenLog(product: ref.product, onDismiss: onDismiss)
        }
    }

    private func resolve(code: String) async {
        guard !isLoading, resolvedProduct == nil else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let product = try await session.api.send(FoodAPI.barcode(code))
            resolvedProduct = ResolvedProduct(product: product)
        } catch APIError.notFound {
            errorMessage = "Barcode not found. Try searching manually."
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct BarcodePhotoThenLog: View {
    let product: FoodProductDTO
    let onDismiss: () -> Void
    @State private var seed: LogEntrySeed?

    var body: some View {
        PhotoCaptureStep(title: "Snap your \(product.name)") { url in
            var s = LogEntrySeed(product: product)
            s.imageUrl = url
            seed = s
        }
        .navigationDestination(item: $seed) { seed in
            LogEntryView(seed: seed, onLogged: { _ in onDismiss() })
        }
    }
}

/// Hashable id-only wrapper so we can drive a `navigationDestination(item:)`
/// off the resolved product without forcing FoodProductDTO to adopt Hashable.
struct ResolvedProduct: Hashable, Identifiable {
    let product: FoodProductDTO
    var id: String { product.id }

    static func == (lhs: Self, rhs: Self) -> Bool { lhs.product.id == rhs.product.id }
    func hash(into hasher: inout Hasher) { hasher.combine(product.id) }
}

private struct BarcodeScannerRepresentable: UIViewControllerRepresentable {
    let onCode: (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode()],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isPinchToZoomEnabled: true,
            isGuidanceEnabled: true,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        try? scanner.startScanning()
        return scanner
    }

    func updateUIViewController(_ uiViewController: DataScannerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onCode: onCode) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onCode: (String) -> Void
        private var lastScanned: String?

        init(onCode: @escaping (String) -> Void) { self.onCode = onCode }

        func dataScanner(
            _ dataScanner: DataScannerViewController,
            didAdd addedItems: [RecognizedItem],
            allItems: [RecognizedItem]
        ) {
            for item in addedItems {
                if case let .barcode(barcode) = item, let payload = barcode.payloadStringValue {
                    if payload != lastScanned {
                        lastScanned = payload
                        onCode(payload)
                    }
                    return
                }
            }
        }
    }
}
