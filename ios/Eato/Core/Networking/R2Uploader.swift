import Foundation

enum R2UploadError: Error, LocalizedError {
    case presign(String)
    case upload(Int)
    case network

    var errorDescription: String? {
        switch self {
        case .presign(let m): "Couldn't prepare upload — \(m)"
        case .upload(let s): "Upload failed (\(s))."
        case .network: "Network unavailable."
        }
    }
}

/// Uploads a food photo to R2 in two steps:
/// 1. Calls `food.presignPhoto` on our backend to get a short-lived presigned PUT URL.
/// 2. PUTs the JPEG/PNG bytes directly to R2.
/// Returns the long-lived public URL the iOS client should send back as
/// `FoodEntry.imageUrl` when calling `food.log`.
actor R2Uploader {
    private let api: APIClient
    private let session: URLSession

    init(api: APIClient, session: URLSession = .shared) {
        self.api = api
        self.session = session
    }

    func upload(imageData data: Data, contentType: String = "image/jpeg") async throws -> String {
        let presign: PresignPhotoResponse
        do {
            presign = try await api.send(FoodAPI.presignPhoto(contentType: contentType))
        } catch let error as APIError {
            throw R2UploadError.presign(error.errorDescription ?? "presign failed")
        }
        guard let url = URL(string: presign.uploadUrl) else {
            throw R2UploadError.presign("invalid upload URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        do {
            let (_, response) = try await session.upload(for: request, from: data)
            guard let http = response as? HTTPURLResponse else {
                throw R2UploadError.upload(0)
            }
            guard (200..<300).contains(http.statusCode) else {
                throw R2UploadError.upload(http.statusCode)
            }
            return presign.publicUrl
        } catch is URLError {
            throw R2UploadError.network
        }
    }
}
