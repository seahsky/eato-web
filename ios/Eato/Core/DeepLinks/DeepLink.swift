import Foundation

enum DeepLink: Equatable {
    case friends                                              // eato://friends
    case friendCode(code: String)                             // eato.app/friends/add/ABC123
    case circle(id: String)                                   // eato://circle/<id>
    case circleMoment(circleId: String, momentId: String)     // eato://circle/<id>/moment/<id>

    static func parse(_ url: URL) -> DeepLink? {
        // Universal Link: https://eato.app/<path>
        if url.scheme == "https", url.host == "eato.app" {
            return fromPath(url.pathComponents)
        }
        // Custom scheme: eato://<host>/<path>
        if url.scheme == "eato" {
            let components = [url.host].compactMap { $0 } + url.pathComponents.filter { $0 != "/" }
            return fromPath(components)
        }
        return nil
    }

    private static func fromPath(_ components: [String]) -> DeepLink? {
        let cleaned = components.filter { !$0.isEmpty && $0 != "/" }
        switch cleaned.first {
        case "friends":
            if cleaned.count >= 3, cleaned[1] == "add" {
                return .friendCode(code: cleaned[2].uppercased())
            }
            return .friends
        case "circle":
            // /circle/<id>/moment/<id>
            if cleaned.count >= 4, cleaned[2] == "moment" {
                return .circleMoment(circleId: cleaned[1], momentId: cleaned[3])
            }
            // /circle/<id>
            if cleaned.count >= 2 {
                return .circle(id: cleaned[1])
            }
            return nil
        default:
            return nil
        }
    }
}
