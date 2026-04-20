import Foundation

enum AuthAPI {
    static var me: Endpoint<UserDTO> { .get("auth/me") }
}
