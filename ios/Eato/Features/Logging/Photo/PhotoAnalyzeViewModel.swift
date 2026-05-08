import Foundation
import Observation
import UIKit

@Observable
@MainActor
final class PhotoAnalyzeViewModel {
    enum Stage: Equatable {
        case picking
        case analysing
        case review([AnalyzedItem])
        case failed(String)
    }

    private(set) var stage: Stage = .picking
    /// Public R2 URL of the user's photo. Set during `analyse(image:)` so each
    /// `LogEntrySeed` produced from a review match carries the user's actual
    /// meal photo (not the FatSecret stock image).
    private(set) var capturedImageUrl: String?

    private let api: APIClient
    private let uploader: R2Uploader

    init(api: APIClient) {
        self.api = api
        self.uploader = R2Uploader(api: api)
    }

    func analyse(image: UIImage) async {
        stage = .analysing
        capturedImageUrl = nil
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else {
            stage = .failed("Couldn't read that image.")
            return
        }
        // Upload first so we have the public URL ready before review.
        // If upload fails, fall back to analysis without a stored photo —
        // the review step still works, the entry just won't be photo-keyed.
        if let url = try? await uploader.upload(imageData: jpeg) {
            capturedImageUrl = url
        }
        guard let base64 = Self.compressBase64(image) else {
            stage = .failed("Couldn't read that image.")
            return
        }
        do {
            let items = try await api.send(FoodAPI.analyzePhoto(.init(image: base64)))
            stage = .review(items)
        } catch let apiError as APIError {
            stage = .failed(apiError.errorDescription ?? "Analysis failed.")
        } catch {
            stage = .failed(error.localizedDescription)
        }
    }

    func setValue(_ stage: Stage) { self.stage = stage }

    static func compressBase64(_ image: UIImage) -> String? {
        // Target ~1.2 MB JPEG so we stay under the backend's 1.5 MB cap.
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
