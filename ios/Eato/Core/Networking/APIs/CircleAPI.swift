import Foundation

enum CircleAPI {
    static func create(_ body: CreateCircleRequest) -> Endpoint<CircleListItemDTO> {
        .post("circles", body: body)
    }

    static var list: Endpoint<[CircleListItemDTO]> {
        .get("circles")
    }

    static func get(circleId: String) -> Endpoint<CircleDetailDTO> {
        .get("circles/\(circleId)")
    }

    static func update(_ body: UpdateCircleRequest) -> Endpoint<CircleListItemDTO> {
        .init(method: .patch, path: "circles/\(body.circleId)", body: try? JSONEncoder.eato.encode(body))
    }

    static func invite(_ body: InviteCircleRequest) -> Endpoint<SuccessResponse> {
        .post("circles/\(body.circleId)/invite", body: body)
    }

    static func kick(_ body: KickCircleMemberRequest) -> Endpoint<SuccessResponse> {
        .post("circles/\(body.circleId)/kick", body: body)
    }

    static func leave(_ body: LeaveCircleRequest) -> Endpoint<LeaveCircleResponse> {
        .post("circles/\(body.circleId)/leave", body: body)
    }

    static func delete(circleId: String) -> Endpoint<SuccessResponse> {
        .init(method: .delete, path: "circles/\(circleId)")
    }

    static func setSchedule(_ body: SetScheduleRequest) -> Endpoint<[CircleScheduleDTO]> {
        .put("circles/\(body.circleId)/schedule", body: body)
    }

    static func callMoment(_ body: CallMomentRequest) -> Endpoint<MealMomentDTO> {
        .post("circles/\(body.circleId)/call", body: body)
    }
}

enum MealMomentAPI {
    static func feed(circleId: String, cursor: String?, limit: Int = 20) -> Endpoint<MomentFeedResponse> {
        var q: [URLQueryItem] = [URLQueryItem(name: "limit", value: String(limit))]
        if let cursor { q.append(URLQueryItem(name: "cursor", value: cursor)) }
        return .get("circles/\(circleId)/moments", query: q)
    }

    static func dayCard(circleId: String, date: String) -> Endpoint<DayCardDTO?> {
        .get("circles/\(circleId)/day-card", query: [URLQueryItem(name: "date", value: date)])
    }

    static func submit(_ body: SubmitMomentRequest) -> Endpoint<FoodEntryDTO> {
        .post("moments/\(body.momentId)/submit", body: body)
    }

    static func react(_ body: ReactRequest) -> Endpoint<ReactResponse> {
        .post("moments/entries/\(body.entryId)/react", body: body)
    }
}
