import SwiftUI

@Observable
@MainActor
final class RestDaysViewModel {
    private(set) var state: RestDayListDTO?
    private(set) var isLoading: Bool = false
    private(set) var errorMessage: String?

    private let api: APIClient

    init(api: APIClient) { self.api = api }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        do { state = try await api.send(RestDayAPI.list) }
        catch let apiError as APIError { errorMessage = apiError.errorDescription }
        catch { errorMessage = error.localizedDescription }
    }

    func declare(_ date: Date) async {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        _ = try? await api.send(RestDayAPI.declare(date: f.string(from: date)))
        await load()
    }

    func remove(_ date: Date) async {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        _ = try? await api.send(RestDayAPI.remove(date: f.string(from: date)))
        await load()
    }
}

struct RestDaysView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: RestDaysViewModel?
    @State private var pickerDate: Date = Date()
    @State private var showDatePicker: Bool = false

    var body: some View {
        Group {
            if let vm = viewModel {
                content(vm)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil { viewModel = RestDaysViewModel(api: session.api) }
            await viewModel?.load()
        }
        .navigationTitle("Rest days")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(_ vm: RestDaysViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                if let state = vm.state {
                    Card {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            Text("\(state.restDaysRemaining) of 6 remaining this month")
                                .font(Typography.titleSmall)
                            Text("Rest days protect your streak. They refresh at the start of each month.")
                                .font(Typography.caption)
                                .foregroundStyle(EatoColor.textSecondary)
                        }
                    }

                    PrimaryButton("Declare rest day") {
                        showDatePicker = true
                    }
                    .disabled(state.restDaysRemaining <= 0)

                    if !state.restDayDates.isEmpty {
                        Text("Used").font(Typography.titleSmall)
                        ForEach(state.restDayDates, id: \.self) { date in
                            HStack {
                                Text(formatted(date))
                                Spacer()
                                Button("Remove") {
                                    Task { await vm.remove(date) }
                                }
                                .foregroundStyle(EatoColor.danger)
                            }
                            .padding(Spacing.md)
                            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
                        }
                    }
                }
                if let errorMessage = vm.errorMessage {
                    Text(errorMessage).font(Typography.caption).foregroundStyle(EatoColor.danger)
                }
            }
            .padding(Spacing.lg)
        }
        .sheet(isPresented: $showDatePicker) {
            NavigationStack {
                DatePicker("Rest day", selection: $pickerDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .padding(Spacing.lg)
                    .navigationTitle("Pick a day")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Declare") {
                                Task {
                                    await viewModel?.declare(pickerDate)
                                    showDatePicker = false
                                }
                            }
                        }
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Cancel") { showDatePicker = false }
                        }
                    }
            }
        }
    }

    private func formatted(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        return f.string(from: date)
    }
}
