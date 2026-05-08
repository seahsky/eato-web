import SwiftUI

/// Mirrors the design's tappable week dots — 7 day pills with letter, day-num,
/// and a "logged" status dot. Future days dim and disable interaction.
/// `viewedDay` is the day currently selected; `today` is anchored separately so
/// the active vs. today distinction shows in the visual treatment.
struct WeekStrip: View {
    let viewedDay: Date
    let today: Date
    /// Set of `yyyy-MM-dd` strings (UTC midnight) where the user has at least
    /// one entry. Drives the green dot under each pill.
    let loggedDays: Set<String>
    var onPick: (Date) -> Void

    var body: some View {
        HStack(spacing: 4) {
            ForEach(weekDays, id: \.self) { day in
                pill(for: day)
            }
        }
    }

    private var weekDays: [Date] {
        var cal = Calendar(identifier: .gregorian)
        cal.firstWeekday = 1 // Sunday — matches design's Sat-anchored row well enough
        guard let weekStart = cal.date(
            from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: today)
        ) else { return [] }
        return (0..<7).compactMap { cal.date(byAdding: .day, value: $0, to: weekStart) }
    }

    @ViewBuilder
    private func pill(for day: Date) -> some View {
        let isViewed = Self.dayKey(day) == Self.dayKey(viewedDay)
        let isToday = Self.dayKey(day) == Self.dayKey(today)
        let isFuture = day > today.eato_endOfDay
        let logged = loggedDays.contains(Self.dayKey(day))

        let bg: Color = {
            if isViewed && isToday { return EatoColor.terracotta.opacity(0.12) }
            if isViewed { return EatoColor.surface }
            return .clear
        }()

        Button {
            guard !isFuture else { return }
            onPick(day)
        } label: {
            VStack(spacing: 4) {
                Text(Self.letter(day))
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundStyle(isViewed ? EatoColor.terracotta : EatoColor.textTertiary)
                    .kerning(0.6)
                Text("\(Calendar.current.component(.day, from: day))")
                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                    .foregroundStyle(
                        isViewed ? EatoColor.terracotta :
                            (isToday ? EatoColor.textPrimary : EatoColor.textSecondary)
                    )
                    .monospacedDigit()
                Circle()
                    .fill(logged ? (isToday ? EatoColor.terracotta : EatoColor.sage) : .clear)
                    .frame(width: logged ? 4 : 3, height: logged ? 4 : 3)
                    .overlay(
                        Circle()
                            .strokeBorder(
                                (logged || isFuture) ? .clear : EatoColor.divider,
                                lineWidth: 1
                            )
                    )
                    .padding(.top, 2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(bg, in: .rect(cornerRadius: 12))
            .opacity(isFuture ? 0.35 : 1)
        }
        .buttonStyle(.plain)
        .disabled(isFuture)
    }

    private static func letter(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return String(f.string(from: date).prefix(1)).uppercased()
    }

    static func dayKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        return f.string(from: date)
    }
}

private extension Date {
    var eato_endOfDay: Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC") ?? .current
        return cal.date(bySettingHour: 23, minute: 59, second: 59, of: self) ?? self
    }
}
