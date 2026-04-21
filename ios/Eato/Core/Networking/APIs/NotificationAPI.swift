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

enum NotificationAPI {
    static func registerIosDevice(_ body: RegisterIosDeviceRequest) -> Endpoint<RegisterIosDeviceResponse> {
        .post("notifications/device/ios", body: body)
    }

    static func unregisterIosDevice(_ body: UnregisterIosDeviceRequest) -> Endpoint<SuccessResponse> {
        .post("notifications/device/ios/remove", body: body)
    }
}
