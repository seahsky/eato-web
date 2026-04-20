import Foundation

enum FoodAPI {
    static func search(query: String, page: Int = 1) -> Endpoint<FoodSearchResponse> {
        .get("food/search", query: [
            URLQueryItem(name: "query", value: query),
            URLQueryItem(name: "page", value: String(page)),
        ])
    }

    static func searchFast(query: String) -> Endpoint<FoodSearchResponse> {
        .get("food/search-fast", query: [URLQueryItem(name: "query", value: query)])
    }

    static func barcode(_ barcode: String) -> Endpoint<FoodProductDTO> {
        .get("food/barcode/\(barcode)")
    }

    static func getByFatSecretId(_ id: String) -> Endpoint<FoodProductDTO> {
        .get("food/fatsecret/\(id)")
    }

    static func logEntry(_ body: LogEntryRequest) -> Endpoint<FoodEntryDTO> {
        .post("food/entries", body: body)
    }

    static func analyzePhoto(_ body: AnalyzePhotoRequest) -> Endpoint<[AnalyzedItem]> {
        .post("food/analyze-photo", body: body)
    }

    static func deleteEntry(_ id: String) -> Endpoint<EmptyResponse> {
        .init(method: .delete, path: "food/entries/\(id)")
    }
}

struct AnalyzePhotoRequest: Encodable, Sendable {
    let image: String // base64
}
