import XCTest
@testable import Eato

final class APIErrorTests: XCTestCase {
    func test_localizedDescriptions_areUserFacing() {
        XCTAssertNotNil(APIError.network.errorDescription)
        XCTAssertNotNil(APIError.unauthorized.errorDescription)
        XCTAssertNotNil(APIError.notFound.errorDescription)
        XCTAssertEqual(APIError.server(message: "hi").errorDescription, "hi")
        XCTAssertNotNil(APIError.decoding.errorDescription)
    }
}
