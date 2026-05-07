import Foundation

struct RegisterIosDeviceRequest: Encodable, Sendable {
    let apnToken: String
    let deviceId: String
    let appVersion: String?
}

struct RegisterIosDeviceResponse: Decodable, Sendable {
    let success: Bool
    let id: String
}

struct SuccessResponse: Decodable, Sendable {
    let success: Bool
}

struct UnregisterIosDeviceRequest: Encodable, Sendable {
    let deviceId: String
}

struct NotificationSettingsDTO: Decodable, Sendable, Equatable {
    var friendFoodLogged: Bool
    var friendGoalReached: Bool
    var friendAdded: Bool
    var receiveNudges: Bool
    var timezone: String
}

struct UpdateNotificationSettingsRequest: Encodable, Sendable {
    let friendFoodLogged: Bool?
    let friendGoalReached: Bool?
    let friendAdded: Bool?
    let receiveNudges: Bool?
    let timezone: String?
}

enum NotificationAPI {
    static func registerIosDevice(_ body: RegisterIosDeviceRequest) -> Endpoint<RegisterIosDeviceResponse> {
        .post("notifications/device/ios", body: body)
    }

    static func unregisterIosDevice(_ body: UnregisterIosDeviceRequest) -> Endpoint<SuccessResponse> {
        .post("notifications/device/ios/remove", body: body)
    }

    static var getSettings: Endpoint<NotificationSettingsDTO> {
        .get("notifications/settings")
    }

    static func updateSettings(_ body: UpdateNotificationSettingsRequest) -> Endpoint<NotificationSettingsDTO> {
        .put("notifications/settings", body: body)
    }
}
