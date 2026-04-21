import Foundation

enum APIError: Error, Equatable, LocalizedError {
    case network
    case unauthorized
    case notFound
    case server(message: String)
    case decoding

    var errorDescription: String? {
        switch self {
        case .network: "No connection. Check your network and try again."
        case .unauthorized: "Your session has expired. Please sign in again."
        case .notFound: "We couldn't find that."
        case .server(let message): message
        case .decoding: "We received an unexpected response from the server."
        }
    }
}

struct ServerErrorBody: Decodable {
    let message: String?
    let error: ErrorEnvelope?

    struct ErrorEnvelope: Decodable {
        let message: String?
    }

    var bestMessage: String? {
        message ?? error?.message
    }
}
