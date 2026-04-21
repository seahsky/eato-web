import Foundation

enum RecipeAPI {
    static var list: Endpoint<RecipesListDTO> { .get("recipes") }
    static func get(_ id: String) -> Endpoint<RecipeDTO> { .get("recipes/\(id)") }
    static func create(_ body: CreateRecipeRequest) -> Endpoint<RecipeDTO> {
        .post("recipes", body: body)
    }
    static func delete(_ id: String) -> Endpoint<EmptyResponse> {
        .init(method: .delete, path: "recipes/\(id)")
    }
    static func logPortion(_ body: LogRecipeRequest) -> Endpoint<EmptyResponse> {
        .post("recipes/log", body: body)
    }
}
