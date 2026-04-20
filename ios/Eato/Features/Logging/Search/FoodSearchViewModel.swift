import Foundation
import Observation

@Observable
@MainActor
final class FoodSearchViewModel {
    var query: String = "" {
        didSet { scheduleSearch() }
    }
    private(set) var results: [FoodProductDTO] = []
    private(set) var isSearching: Bool = false
    private(set) var errorMessage: String?

    private let api: APIClient
    private var searchTask: Task<Void, Never>?

    init(api: APIClient) {
        self.api = api
    }

    private func scheduleSearch() {
        searchTask?.cancel()
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2 else {
            results = []
            isSearching = false
            return
        }
        searchTask = Task { [weak self, trimmed] in
            try? await Task.sleep(nanoseconds: 300_000_000) // 300ms debounce
            guard !Task.isCancelled else { return }
            await self?.performSearch(for: trimmed)
        }
    }

    private func performSearch(for trimmed: String) async {
        isSearching = true
        defer { isSearching = false }
        errorMessage = nil
        do {
            let response = try await api.send(FoodAPI.searchFast(query: trimmed))
            guard !Task.isCancelled else { return }
            results = response.products
        } catch let apiError as APIError {
            if case .network = apiError {
                errorMessage = apiError.errorDescription
            } else if case .server = apiError {
                errorMessage = apiError.errorDescription
            }
            results = []
        } catch {
            errorMessage = error.localizedDescription
            results = []
        }
    }
}
