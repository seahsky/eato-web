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

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func analyse(image: UIImage) async {
        stage = .analysing
        guard let base64 = Self.compress(image) else {
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

    static func compress(_ image: UIImage) -> String? {
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
