import XCTest
@testable import Eato

final class DeepLinkTests: XCTestCase {
    func test_universalLink_friendCode_parses() {
        let url = URL(string: "https://eato.app/friends/add/ABC123")!
        XCTAssertEqual(DeepLink.parse(url), .friendCode(code: "ABC123"))
    }

    func test_customScheme_friendCode_parses() {
        let url = URL(string: "eato://friends/add/abc123")!
        XCTAssertEqual(DeepLink.parse(url), .friendCode(code: "ABC123"))
    }

    func test_customScheme_friends_plain_parses() {
        let url = URL(string: "eato://friends")!
        XCTAssertEqual(DeepLink.parse(url), .friends)
    }

    func test_universalLink_friends_plain_parses() {
        let url = URL(string: "https://eato.app/friends")!
        XCTAssertEqual(DeepLink.parse(url), .friends)
    }

    func test_legacy_partner_path_returnsNil() {
        let url = URL(string: "https://eato.app/partner/link/ABC123")!
        XCTAssertNil(DeepLink.parse(url))
    }

    func test_unknown_path_returnsNil() {
        let url = URL(string: "https://eato.app/random/thing")!
        XCTAssertNil(DeepLink.parse(url))
    }

    func test_otherScheme_returnsNil() {
        let url = URL(string: "https://other.example.com/friends/add/ABC123")!
        XCTAssertNil(DeepLink.parse(url))
    }
}
