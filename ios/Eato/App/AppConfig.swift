import Foundation

enum AppConfig {
    static let apiBaseURL: URL = {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "EatoAPIBaseURL") as? String,
            let url = URL(string: value)
        else {
            preconditionFailure("EatoAPIBaseURL missing from Info.plist — check xcconfig")
        }
        return url
    }()

    static let clerkPublishableKey: String = {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "EatoClerkPublishableKey") as? String,
            !value.isEmpty
        else {
            preconditionFailure("EatoClerkPublishableKey missing — set CLERK_PUBLISHABLE_KEY in Config/Local.xcconfig")
        }
        return value
    }()
}
