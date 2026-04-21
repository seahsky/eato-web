import Foundation

// Swift port of src/lib/meal-parser.ts. Takes one ingredient per line and
// normalises to grams. Energy-first lines like "352 kj salmon" aren't
// supported here (YAGNI for Phase 7 v1 — users can paste 100g lines and
// the lookup handles the rest).
enum MealParser {
    struct Parsed: Identifiable, Hashable {
        let id: String
        let rawLine: String
        let quantity: Double
        let unit: String
        let normalizedGrams: Double
        let ingredientName: String
        let parseError: String?
    }

    static func parse(_ text: String) -> [Parsed] {
        let lines = text.split(whereSeparator: \.isNewline)
        var out: [Parsed] = []
        for (index, raw) in lines.enumerated() {
            let trimmed = raw.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { continue }
            out.append(parseLine(trimmed, index: index))
        }
        return out
    }

    private static let regex = try! NSRegularExpression(
        pattern: "^(\\d+(?:\\.\\d+)?)\\s*(g|kg|ml|l)?\\s+(.+)$",
        options: .caseInsensitive
    )

    private static func parseLine(_ trimmed: String, index: Int) -> Parsed {
        let ns = trimmed as NSString
        let range = NSRange(location: 0, length: ns.length)
        guard let match = regex.firstMatch(in: trimmed, range: range), match.numberOfRanges == 4 else {
            return .init(
                id: "ing-\(index)",
                rawLine: trimmed,
                quantity: 0,
                unit: "g",
                normalizedGrams: 0,
                ingredientName: trimmed,
                parseError: "Couldn't read a quantity"
            )
        }
        let qtyString = ns.substring(with: match.range(at: 1))
        let unitString = match.range(at: 2).location != NSNotFound
            ? ns.substring(with: match.range(at: 2)).lowercased()
            : "g"
        let name = ns.substring(with: match.range(at: 3)).trimmingCharacters(in: .whitespaces)
        let quantity = Double(qtyString) ?? 0

        let grams: Double
        switch unitString {
        case "kg": grams = quantity * 1000
        case "l": grams = quantity * 1000
        case "ml", "g": grams = quantity
        default: grams = quantity
        }

        if quantity <= 0 {
            return .init(
                id: "ing-\(index)",
                rawLine: trimmed,
                quantity: 0,
                unit: "g",
                normalizedGrams: 0,
                ingredientName: name,
                parseError: "Invalid quantity"
            )
        }

        return .init(
            id: "ing-\(index)",
            rawLine: trimmed,
            quantity: quantity,
            unit: unitString,
            normalizedGrams: grams,
            ingredientName: name,
            parseError: nil
        )
    }
}
