import Foundation

enum DeepLink: Equatable {
    case partner               // eato://partner
    case partnerLink(code: String) // eato.app/partner/link/ABC123 or eato://partner/link/ABC123
    case approve(entryId: String)  // eato.app/approve/<id> or eato://approve/<id>

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
        case "partner":
            if cleaned.count >= 3, cleaned[1] == "link" {
                return .partnerLink(code: cleaned[2].uppercased())
            }
            return .partner
        case "approve":
            if cleaned.count >= 2 {
                return .approve(entryId: cleaned[1])
            }
            return nil
        default:
            return nil
        }
    }
}
