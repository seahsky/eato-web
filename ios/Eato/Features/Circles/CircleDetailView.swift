import SwiftUI

struct CircleDetailView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    let circleId: String

    @State private var vm: CircleDetailViewModel?
    @State private var showInvite: Bool = false
    @State private var showScheduleEditor: Bool = false
    @State private var showCallSheet: Bool = false
    @State private var openMoment: MealMomentDTO?
    @State private var openCapture: MealMomentDTO?

    var body: some View {
        Group {
            if let vm {
                content(vm)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(EatoColor.background.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if vm == nil {
                vm = CircleDetailViewModel(api: session.api, circleId: circleId)
                await vm?.refreshAll()
            }
        }
        .sheet(isPresented: $showInvite) {
            if let vm {
                InviteFriendSheet(vm: vm)
                    .presentationDetents([.medium, .large])
            }
        }
        .sheet(isPresented: $showScheduleEditor) {
            if let vm, let detail = vm.detail {
                ScheduleEditorSheet(vm: vm, schedules: detail.schedules)
                    .presentationDetents([.large])
            }
        }
        .confirmationDialog("Call a moment?", isPresented: $showCallSheet) {
            Button("Eating now") {
                Task {
                    if let moment = await vm?.callMoment(label: nil) {
                        openCapture = moment
                    }
                }
            }
            Button("Breakfast") { Task { _ = await vm?.callMoment(label: "Breakfast"); await vm?.loadFeed(reset: true) } }
            Button("Lunch")     { Task { _ = await vm?.callMoment(label: "Lunch");     await vm?.loadFeed(reset: true) } }
            Button("Dinner")    { Task { _ = await vm?.callMoment(label: "Dinner");    await vm?.loadFeed(reset: true) } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Everyone in the circle gets a push to log their plate.")
        }
        .navigationDestination(item: $openMoment) { moment in
            MomentGridView(circleId: circleId, momentId: moment.id)
        }
        .fullScreenCover(item: $openCapture) { moment in
            NavigationStack {
                MomentCaptureView(
                    circleId: circleId,
                    momentId: moment.id,
                    label: moment.label,
                    circleEmoji: vm?.detail?.emoji ?? "🍽️"
                ) {
                    openCapture = nil
                    Task { await vm?.loadFeed(reset: true) }
                }
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: CircleDetailViewModel) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                if let detail = vm.detail {
                    header(detail)
                    callMomentTile
                    membersCard(detail)
                    if detail.myRole == "OWNER" {
                        schedulesCard(detail)
                    }
                    momentsSection(vm)
                    if let err = vm.lastError {
                        Text(err)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(EatoColor.danger)
                    }
                } else {
                    ProgressView().padding(.top, 40)
                }
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
        .refreshable { await vm.refreshAll() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    if vm.detail?.myRole == "OWNER" {
                        Button("Edit schedule") { showScheduleEditor = true }
                        Button("Delete circle", role: .destructive) {
                            Task {
                                if await vm.deleteCircle() { dismiss() }
                            }
                        }
                    } else {
                        Button("Leave circle", role: .destructive) {
                            Task {
                                if await vm.leave() { dismiss() }
                            }
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundStyle(EatoColor.terracotta)
                }
            }
        }
    }

    private func header(_ detail: CircleDetailDTO) -> some View {
        HStack(spacing: 14) {
            Text(detail.emoji)
                .font(.system(size: 44))
                .frame(width: 64, height: 64)
                .background(EatoColor.surfaceWarm, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(detail.name)
                    .font(.system(size: 26, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text(detail.timezone)
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
        }
    }

    private var callMomentTile: some View {
        Button {
            showCallSheet = true
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(EatoColor.terracotta)
                        .frame(width: 48, height: 48)
                    Image(systemName: "fork.knife")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Call a moment")
                        .font(.system(size: 16, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                    Text("Ping the circle to log together")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            .padding(14)
            .background(EatoColor.surface, in: .rect(cornerRadius: 18))
            .softShadow(elevation: 4)
        }
        .buttonStyle(.plain)
    }

    private func membersCard(_ detail: CircleDetailDTO) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("MEMBERS · \(detail.members.count)")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                Spacer()
                if detail.myRole == "OWNER" && detail.members.count < 8 {
                    Button { showInvite = true } label: {
                        Label("Add", systemImage: "plus")
                            .font(.system(size: 12, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.terracotta)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 6)

            ForEach(detail.members) { member in
                memberRow(member, isOwnerView: detail.myRole == "OWNER")
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: 18))
        .softShadow(elevation: 2)
    }

    private func memberRow(_ member: CircleMemberDTO, isOwnerView: Bool) -> some View {
        HStack(spacing: 12) {
            Avatar(initials: initials(member.name ?? member.email), size: .md)
            VStack(alignment: .leading, spacing: 1) {
                Text(member.name ?? member.email)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text(member.role.lowercased().capitalized)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            if isOwnerView && member.role != "OWNER" {
                Menu {
                    Button("Remove from circle", role: .destructive) {
                        Task { await vm?.kick(userId: member.userId) }
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .foregroundStyle(EatoColor.textTertiary)
                        .padding(8)
                }
            }
        }
        .padding(.vertical, 6)
    }

    private func schedulesCard(_ detail: CircleDetailDTO) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("SCHEDULE · \(detail.schedules.count)")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
                    .kerning(1.2)
                Spacer()
                Button { showScheduleEditor = true } label: {
                    Text("Edit")
                        .font(.system(size: 12, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.terracotta)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 6)

            if detail.schedules.isEmpty {
                Text("No scheduled meal moments yet — tap Edit to add one.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 14)
            } else {
                ForEach(detail.schedules) { s in
                    HStack {
                        Text(s.label)
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.textPrimary)
                        Spacer()
                        Text(s.localTime)
                            .font(.system(size: 14, weight: .heavy, design: .monospaced))
                            .foregroundStyle(EatoColor.terracotta)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                }
                .padding(.bottom, 6)
            }
        }
        .background(EatoColor.surface, in: .rect(cornerRadius: 18))
        .softShadow(elevation: 2)
    }

    private func momentsSection(_ vm: CircleDetailViewModel) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RECENT MOMENTS")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.2)
                .padding(.horizontal, 4)

            if vm.moments.isEmpty {
                Text("No moments yet. Schedule one or tap Call a moment to start.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(EatoColor.surface, in: .rect(cornerRadius: 16))
                    .softShadow(elevation: 2)
            } else {
                ForEach(vm.moments) { m in
                    Button { openMoment = m } label: {
                        momentRow(m)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func momentRow(_ m: MealMomentDTO) -> some View {
        let filled = m.entries.filter { $0.foodEntryId != nil }.count
        let total = m.entries.count
        return HStack(spacing: 12) {
            if let url = m.gridImageUrl, let u = URL(string: url) {
                AsyncImage(url: u) { phase in
                    switch phase {
                    case .success(let img): img.resizable().scaledToFill()
                    default: placeholderTile
                    }
                }
                .frame(width: 64, height: 64)
                .clipShape(.rect(cornerRadius: 12))
            } else {
                placeholderTile
                    .frame(width: 64, height: 64)
                    .clipShape(.rect(cornerRadius: 12))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(m.label)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("\(filled)/\(total) logged · \(timeStamp(m.firedAt))")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textTertiary)
            }
            Spacer()
            if m.kind == "ADHOC" {
                Text("AD HOC")
                    .font(.system(size: 9, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(EatoColor.terracotta.opacity(0.12), in: Capsule())
            }
        }
        .padding(12)
        .background(EatoColor.surface, in: .rect(cornerRadius: 16))
        .softShadow(elevation: 2)
    }

    private var placeholderTile: some View {
        ZStack {
            EatoColor.surfaceWarm
            Image(systemName: "fork.knife")
                .font(.system(size: 20, weight: .heavy))
                .foregroundStyle(EatoColor.terracotta.opacity(0.4))
        }
    }

    private func initials(_ s: String) -> String {
        let parts = s.split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)).uppercased() }
        return String(s.prefix(1)).uppercased()
    }

    private func timeStamp(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d · h:mm a"
        return f.string(from: d)
    }
}

// MARK: - Invite friend sheet

private struct InviteFriendSheet: View {
    @Bindable var vm: CircleDetailViewModel
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var friends: [FriendDTO] = []
    @State private var loading: Bool = true
    @State private var pendingId: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Capsule()
                .fill(EatoColor.divider)
                .frame(width: 38, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

            Text("Invite a friend")
                .font(.system(size: 22, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)

            Text("Only your accepted friends can join a circle.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textSecondary)

            if loading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 24)
            } else if friends.isEmpty {
                Text("You don't have any friends yet — add one from the Friends tab first.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
                    .padding(.top, 12)
            } else {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(friends) { friend in
                            friendRow(friend)
                        }
                    }
                }
            }

            if let err = vm.lastError {
                Text(err)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(EatoColor.danger)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .background(EatoColor.background)
        .task { await load() }
    }

    @ViewBuilder
    private func friendRow(_ friend: FriendDTO) -> some View {
        let alreadyInCircle = (vm.detail?.members.contains { $0.userId == friend.id } ?? false)
        HStack(spacing: 12) {
            Avatar(initials: initials(friend.name ?? friend.email), size: .md)
            VStack(alignment: .leading, spacing: 1) {
                Text(friend.name ?? friend.email)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                if alreadyInCircle {
                    Text("Already in circle")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(EatoColor.textTertiary)
                }
            }
            Spacer()
            Button {
                Task {
                    pendingId = friend.id
                    if await vm.invite(friendUserId: friend.id) { dismiss() }
                    pendingId = nil
                }
            } label: {
                Text(pendingId == friend.id ? "Adding…" : "Invite")
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(EatoColor.terracotta, in: Capsule())
            }
            .buttonStyle(.plain)
            .disabled(alreadyInCircle || pendingId != nil)
            .opacity(alreadyInCircle ? 0.4 : 1)
        }
        .padding(10)
        .background(EatoColor.surface, in: .rect(cornerRadius: 14))
        .softShadow(elevation: 1)
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            friends = try await session.api.send(FriendAPI.list)
        } catch {
            // Surface via vm.lastError shape so the sheet shows the row.
            vm.lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func initials(_ s: String) -> String {
        let parts = s.split(separator: " ").map(String.init)
        if parts.count >= 2 { return String(parts[0].prefix(1) + parts[1].prefix(1)).uppercased() }
        return String(s.prefix(1)).uppercased()
    }
}

// MARK: - Schedule editor sheet

private struct ScheduleEditorSheet: View {
    @Bindable var vm: CircleDetailViewModel
    @Environment(\.dismiss) private var dismiss

    struct DraftRow: Identifiable {
        let id = UUID()
        var label: String
        var time: Date
        var daysOfWeek: Int       // bitmask
    }

    @State private var rows: [DraftRow]

    init(vm: CircleDetailViewModel, schedules: [CircleScheduleDTO]) {
        self._vm = Bindable(vm)
        let parsed = schedules.map { s -> DraftRow in
            let comps = s.localTime.split(separator: ":").compactMap { Int($0) }
            var date = Date()
            if comps.count == 2 {
                let cal = Calendar.current
                var dc = cal.dateComponents([.year, .month, .day], from: Date())
                dc.hour = comps[0]
                dc.minute = comps[1]
                date = cal.date(from: dc) ?? Date()
            }
            return DraftRow(label: s.label, time: date, daysOfWeek: s.daysOfWeek)
        }
        self._rows = State(initialValue: parsed)
    }

    private static let dayLabels = ["S", "M", "T", "W", "T", "F", "S"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach($rows) { $row in
                        rowEditor(row: $row)
                    }
                    Button { addRow() } label: {
                        Label("Add meal time", systemImage: "plus")
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.terracotta)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(EatoColor.terracotta.opacity(0.1), in: Capsule())
                    }
                    .buttonStyle(.plain)
                    if let err = vm.lastError {
                        Text(err)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(EatoColor.danger)
                    }
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
            }
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .background(EatoColor.background)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            let items = rows.map { row -> SetScheduleRequest.Item in
                                let comps = Calendar.current.dateComponents([.hour, .minute], from: row.time)
                                let hh = String(format: "%02d", comps.hour ?? 0)
                                let mm = String(format: "%02d", comps.minute ?? 0)
                                return SetScheduleRequest.Item(
                                    label: row.label.isEmpty ? "Meal" : row.label,
                                    localTime: "\(hh):\(mm)",
                                    daysOfWeek: row.daysOfWeek
                                )
                            }
                            await vm.setSchedule(items)
                            if vm.lastError == nil { dismiss() }
                        }
                    } label: {
                        Text(vm.isWorking ? "Saving…" : "Save")
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.terracotta)
                    }
                    .disabled(vm.isWorking)
                }
            }
        }
    }

    @ViewBuilder
    private func rowEditor(row: Binding<DraftRow>) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                TextField("Label", text: row.label)
                    .textFieldStyle(.plain)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .padding(.horizontal, 12)
                    .frame(height: 40)
                    .background(EatoColor.surfaceWarm, in: .rect(cornerRadius: 10))

                DatePicker("", selection: row.time, displayedComponents: .hourAndMinute)
                    .labelsHidden()

                Button(role: .destructive) {
                    rows.removeAll { $0.id == row.wrappedValue.id }
                } label: {
                    Image(systemName: "trash")
                        .foregroundStyle(EatoColor.danger)
                        .padding(8)
                }
            }
            HStack(spacing: 6) {
                ForEach(0..<7, id: \.self) { idx in
                    let active = (row.wrappedValue.daysOfWeek & (1 << idx)) != 0
                    Button {
                        if active {
                            row.wrappedValue.daysOfWeek &= ~(1 << idx)
                        } else {
                            row.wrappedValue.daysOfWeek |= (1 << idx)
                        }
                    } label: {
                        Text(Self.dayLabels[idx])
                            .font(.system(size: 12, weight: .heavy, design: .rounded))
                            .foregroundStyle(active ? .white : EatoColor.textTertiary)
                            .frame(maxWidth: .infinity, minHeight: 32)
                            .background(active ? EatoColor.terracotta : EatoColor.surfaceWarm, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(12)
        .background(EatoColor.surface, in: .rect(cornerRadius: 14))
        .softShadow(elevation: 2)
    }

    private func addRow() {
        var dc = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        dc.hour = 12
        dc.minute = 0
        rows.append(DraftRow(label: "Lunch", time: Calendar.current.date(from: dc) ?? Date(), daysOfWeek: 127))
    }
}
