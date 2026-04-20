import Foundation

enum PartnerAPI {
    static var generateCode: Endpoint<PartnerCodeDTO> {
        .post("auth/partner-code", body: EmptyBody())
    }

    static func link(code: String) -> Endpoint<LinkPartnerResponse> {
        .post("auth/link-partner", body: LinkPartnerRequest(code: code))
    }

    static var unlink: Endpoint<UnlinkPartnerResponse> {
        .post("auth/unlink-partner", body: EmptyBody())
    }

    static var pendingApprovals: Endpoint<[PendingEntryDTO]> {
        .get("food/pending-approvals")
    }

    static var pendingApprovalsCount: Endpoint<PendingCountDTO> {
        .get("food/pending-approvals/count")
    }

    static func approve(_ entryId: String) -> Endpoint<ApproveResponse> {
        .post("food/entries/\(entryId)/approve", body: EmptyBody())
    }

    static func reject(_ entryId: String, note: String?) -> Endpoint<ApproveResponse> {
        .post("food/entries/\(entryId)/reject", body: RejectRequest(note: note))
    }

    static func partnerDaily(date: String) -> Endpoint<DailySummaryDTO> {
        .get("stats/partner/daily", query: [URLQueryItem(name: "date", value: date)])
    }
}

struct PendingCountDTO: Decodable, Sendable { let count: Int }

// tRPC-over-REST endpoints that take no body still need a JSON `{}` sent
// for POST-with-input procedures; this empty struct encodes to `{}`.
struct EmptyBody: Encodable, Sendable {}
