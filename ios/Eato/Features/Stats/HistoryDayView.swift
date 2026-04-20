import SwiftUI

struct HistoryDayView: View {
    @Environment(SessionStore.self) private var session
    @State private var entries: [FoodEntryDTO]?
    @State private var loadError: APIError?
    let date: Date
    let calorieGoal: Double

    var body: some View {
        Group {
            if let entries {
                if entries.isEmpty {
                    EmptyState(
                        systemImage: "calendar.badge.exclamationmark",
                        title: "Nothing logged",
                        message: "No entries for this day."
                    )
                } else {
                    List {
                        Section {
                            HStack {
                                Text("Total")
                                Spacer()
                                Text("\(Int(total)) kcal")
                                    .font(Typography.monoDigits)
                            }
                        }
                        Section("Entries") {
                            ForEach(entries) { entry in
                                VStack(alignment: .leading, spacing: Spacing.xxs) {
                                    Text(entry.foodName)
                                    HStack {
                                        if let brand = entry.brandName {
                                            Text(brand)
                                                .font(Typography.caption)
                                                .foregroundStyle(EatoColor.textSecondary)
                                        }
                                        Spacer()
                                        Text("\(Int(entry.calories)) kcal")
                                            .font(Typography.monoDigits)
                                    }
                                }
                            }
                        }
                    }
                }
            } else if let loadError {
                EmptyState(
                    systemImage: "exclamationmark.triangle",
                    title: "Couldn't load day",
                    message: loadError.errorDescription ?? "",
                    action: ("Retry", { Task { await load() } })
                )
            } else {
                ProgressView()
            }
        }
        .navigationTitle(formattedDate)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var total: Double {
        entries?.reduce(0) { $0 + $1.calories } ?? 0
    }

    private var formattedDate: String {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        return f.string(from: date)
    }

    private func load() async {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        do {
            entries = try await session.api.send(FoodEntriesAPI.byDate(dateStr))
            loadError = nil
        } catch let apiError as APIError {
            loadError = apiError
        } catch {
            loadError = .server(message: error.localizedDescription)
        }
    }
}
