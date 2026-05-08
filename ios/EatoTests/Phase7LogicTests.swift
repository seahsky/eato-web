import XCTest
@testable import Eato

final class Phase7LogicTests: XCTestCase {
    // MARK: - GoalKind.infer (Phase 7d)

    func test_goalKind_infer_underTDEEbyAtLeast250_isLose() {
        XCTAssertEqual(GoalKind.infer(calorieGoal: 1500, tdee: 2000), .lose)
        XCTAssertEqual(GoalKind.infer(calorieGoal: 1750, tdee: 2000), .lose, "boundary at -250 should still be lose")
    }

    func test_goalKind_infer_overTDEEbyAtLeast250_isGain() {
        XCTAssertEqual(GoalKind.infer(calorieGoal: 2500, tdee: 2000), .gain)
        XCTAssertEqual(GoalKind.infer(calorieGoal: 2250, tdee: 2000), .gain, "boundary at +250 should still be gain")
    }

    func test_goalKind_infer_inMaintenanceBand_isMaintain() {
        XCTAssertEqual(GoalKind.infer(calorieGoal: 2000, tdee: 2000), .maintain)
        XCTAssertEqual(GoalKind.infer(calorieGoal: 1800, tdee: 2000), .maintain, "diff -200 inside ±250 band")
        XCTAssertEqual(GoalKind.infer(calorieGoal: 2200, tdee: 2000), .maintain, "diff +200 inside ±250 band")
    }

    func test_goalKind_deltaFromTDEE() {
        XCTAssertEqual(GoalKind.lose.deltaFromTDEE, -500)
        XCTAssertEqual(GoalKind.maintain.deltaFromTDEE, 0)
        XCTAssertEqual(GoalKind.gain.deltaFromTDEE, 500)
    }

    // MARK: - BadgeRarity (Phase 7c)

    func test_badgeRarity_glowOpacity_increasesWithTier() {
        XCTAssertEqual(BadgeRarity.common.glowOpacity, 0.0)
        XCTAssertLessThan(BadgeRarity.common.glowOpacity, BadgeRarity.uncommon.glowOpacity)
        XCTAssertLessThan(BadgeRarity.uncommon.glowOpacity, BadgeRarity.rare.glowOpacity)
        XCTAssertLessThan(BadgeRarity.rare.glowOpacity, BadgeRarity.epic.glowOpacity)
        XCTAssertLessThan(BadgeRarity.epic.glowOpacity, BadgeRarity.legendary.glowOpacity)
    }

    func test_badgeDTO_rarityTier_fallsBackToCommonWhenMissing() {
        let payload = #"{"id":"x","name":"X","description":"d","unlocked":false}"#
        let dto = try? JSONDecoder().decode(BadgeDTO.self, from: Data(payload.utf8))
        XCTAssertEqual(dto?.rarityTier, .common)
    }

    func test_badgeDTO_rarityTier_decodesUnknownAsCommon() {
        let payload = #"{"id":"x","name":"X","description":"d","unlocked":true,"rarity":"mythic"}"#
        let dto = try? JSONDecoder().decode(BadgeDTO.self, from: Data(payload.utf8))
        XCTAssertEqual(dto?.rarityTier, .common, "unknown rarity tiers fall back to common")
    }

    func test_badgeDTO_rarityTier_decodesKnownTier() {
        let payload = #"{"id":"x","name":"X","description":"d","unlocked":true,"rarity":"epic"}"#
        let dto = try? JSONDecoder().decode(BadgeDTO.self, from: Data(payload.utf8))
        XCTAssertEqual(dto?.rarityTier, .epic)
    }

    func test_badgeDTO_legacyEmojiKey_isAcceptedAsIcon() {
        // Legacy payloads sent `emoji`; the new schema is `icon`. Custom decoder
        // accepts both so older deployments still decode.
        let payload = #"{"id":"x","name":"X","description":"d","unlocked":true,"emoji":"flame"}"#
        let dto = try? JSONDecoder().decode(BadgeDTO.self, from: Data(payload.utf8))
        XCTAssertEqual(dto?.icon, "flame")
    }
}
