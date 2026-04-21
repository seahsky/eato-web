import Foundation
import Observation

@Observable
@MainActor
final class RecipesListViewModel {
    enum LoadState: Equatable {
        case idle, loading, loaded, failed(APIError)
    }

    private(set) var state: LoadState = .idle
    private(set) var list: RecipesListDTO?

    private let api: APIClient

    init(api: APIClient) { self.api = api }

    func load() async {
        state = .loading
        do {
            list = try await api.send(RecipeAPI.list)
            state = .loaded
        } catch let apiError as APIError {
            state = .failed(apiError)
        } catch {
            state = .failed(.server(message: error.localizedDescription))
        }
    }

    func delete(_ recipe: RecipeDTO) async {
        _ = try? await api.send(RecipeAPI.delete(recipe.id))
        await load()
    }
}
