import Foundation
import Observation

@Observable
@MainActor
final class PartnerLinkViewModel {
    var codeEntry: String = ""
    private(set) var myCode: PartnerCodeDTO?
    private(set) var errorMessage: String?
    private(set) var isGenerating: Bool = false
    private(set) var isLinking: Bool = false

    private let api: APIClient
    private let onLinked: @MainActor () async -> Void

    init(api: APIClient, onLinked: @escaping @MainActor () async -> Void) {
        self.api = api
        self.onLinked = onLinked
    }

    func generateCode() async {
        isGenerating = true
        defer { isGenerating = false }
        errorMessage = nil
        do {
            myCode = try await api.send(PartnerAPI.generateCode)
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func linkWithEnteredCode() async {
        let trimmed = codeEntry.uppercased().trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count == 6 else {
            errorMessage = "Code should be 6 characters."
            return
        }
        isLinking = true
        defer { isLinking = false }
        errorMessage = nil
        do {
            _ = try await api.send(PartnerAPI.link(code: trimmed))
            await onLinked()
        } catch let apiError as APIError {
            errorMessage = apiError.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
