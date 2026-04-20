import XCTest
@testable import Eato

final class DeepLinkTests: XCTestCase {
    func test_universalLink_partnerLink_parses() {
        let url = URL(string: "https://eato.app/partner/link/ABC123")!
        XCTAssertEqual(DeepLink.parse(url), .partnerLink(code: "ABC123"))
    }

    func test_customScheme_partnerLink_parses() {
        let url = URL(string: "eato://partner/link/abc123")!
        XCTAssertEqual(DeepLink.parse(url), .partnerLink(code: "ABC123"))
    }

    func test_universalLink_approve_parses() {
        let url = URL(string: "https://eato.app/approve/abc-123")!
        XCTAssertEqual(DeepLink.parse(url), .approve(entryId: "abc-123"))
    }

    func test_customScheme_approve_parses() {
        let url = URL(string: "eato://approve/xyz")!
        XCTAssertEqual(DeepLink.parse(url), .approve(entryId: "xyz"))
    }

    func test_customScheme_partner_plain_parses() {
        let url = URL(string: "eato://partner")!
        XCTAssertEqual(DeepLink.parse(url), .partner)
    }

    func test_unknown_path_returnsNil() {
        let url = URL(string: "https://eato.app/random/thing")!
        XCTAssertNil(DeepLink.parse(url))
    }

    func test_otherScheme_returnsNil() {
        let url = URL(string: "https://other.example.com/partner/link/ABC123")!
        XCTAssertNil(DeepLink.parse(url))
    }
}
