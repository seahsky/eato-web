import SwiftUI

/// 6-step onboarding flow per design `profile.jsx:155-162`.
/// Renders progress dots → title + subtitle → step content → bottom
/// Continue / Back buttons.
struct OnboardingView: View {
    @Environment(SessionStore.self) private var session
    @State private var viewModel: OnboardingViewModel?

    var body: some View {
        Group {
            if let viewModel {
                content(viewModel)
            } else {
                ProgressView()
            }
        }
        .task {
            if viewModel == nil {
                viewModel = OnboardingViewModel(
                    api: session.api,
                    prefill: session.currentUser?.profile
                ) { [session] in
                    await session.loadMe()
                }
            }
        }
    }

    @ViewBuilder
    private func content(_ vm: OnboardingViewModel) -> some View {
        @Bindable var vm = vm
        VStack(spacing: 0) {
            ProgressDots(stepIndex: vm.step.rawValue, total: OnboardingStep.allCases.count)
                .padding(.top, 58)
                .padding(.bottom, 22)

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text(vm.step.title)
                        .font(.system(size: 32, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                        .lineSpacing(2)

                    Text(vm.step.subtitle)
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(EatoColor.textSecondary)
                        .padding(.top, 14)
                        .lineSpacing(2)

                    stepContent(vm: vm)
                        .padding(.top, 28)

                    if let errorMessage = vm.errorMessage {
                        Text(errorMessage)
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.danger)
                            .padding(.top, 12)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 28)
            }

            HStack(spacing: 10) {
                if vm.step != .gender {
                    Button(action: vm.goBack) {
                        Text("Back")
                            .font(.system(size: 15, weight: .heavy, design: .rounded))
                            .foregroundStyle(EatoColor.textPrimary)
                            .padding(.vertical, 16)
                            .padding(.horizontal, 22)
                            .background(EatoColor.surface, in: Capsule())
                            .softShadow(elevation: 2)
                    }
                    .buttonStyle(.plain)
                }

                PrimaryButton(
                    vm.step == .summary ? "Start your diary" : "Continue",
                    isLoading: vm.isSaving
                ) {
                    Task { await vm.advance() }
                }
                .disabled(!vm.canAdvance || vm.isSaving)
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)
            .padding(.bottom, 22)
        }
        .background(EatoColor.background)
    }

    @ViewBuilder
    private func stepContent(vm: OnboardingViewModel) -> some View {
        @Bindable var vm = vm
        switch vm.step {
        case .gender: GenderStep(selection: $vm.gender)
        case .height: BigNumberStep(value: $vm.heightCm, unit: "cm", range: 120...220, step: 1)
        case .weight: BigNumberStep(value: $vm.weightKg, unit: "kg", range: 35...160, step: 1)
        case .age: BigNumberIntStep(value: $vm.age, unit: "years", range: 14...90)
        case .activity: ActivityStep(vm: vm)
        case .summary: SummaryStep(vm: vm)
        }
    }
}

// MARK: - Progress dots

private struct ProgressDots: View {
    let stepIndex: Int
    let total: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<total, id: \.self) { i in
                Capsule()
                    .fill(i <= stepIndex ? EatoColor.terracotta : EatoColor.divider)
                    .frame(width: i == stepIndex ? 22 : 6, height: 6)
                    .animation(.easeOut(duration: 0.22), value: stepIndex)
            }
        }
    }
}

// MARK: - Steps

private struct GenderStep: View {
    @Binding var selection: Gender

    private let options: [Gender] = [.female, .male, .nonbinary, .preferNotToSay]

    var body: some View {
        LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)],
            spacing: 10
        ) {
            ForEach(options, id: \.self) { g in
                Button {
                    withAnimation(.smooth(duration: 0.18)) { selection = g }
                } label: {
                    Text(g.label)
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(EatoColor.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 22)
                        .padding(.horizontal, 16)
                        .background(
                            selection == g
                                ? EatoColor.terracotta.opacity(0.08)
                                : EatoColor.surface,
                            in: .rect(cornerRadius: 18)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .strokeBorder(
                                    selection == g ? EatoColor.terracotta : .clear,
                                    lineWidth: 2
                                )
                        )
                        .softShadow(elevation: 2)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct BigNumberStep: View {
    @Binding var value: Double
    let unit: String
    let range: ClosedRange<Double>
    let step: Double

    var body: some View {
        VStack(spacing: 30) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(format(value))
                    .font(.system(size: 76, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
                    .monospacedDigit()
                Text(unit)
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }

            VStack(spacing: 6) {
                Slider(
                    value: $value,
                    in: range,
                    step: step
                )
                .tint(EatoColor.terracotta)

                HStack {
                    Text(format(range.lowerBound))
                    Spacer()
                    Text(format(range.upperBound))
                }
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 20)
    }

    private func format(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "\(Int(v))" : String(format: "%.1f", v)
    }
}

private struct BigNumberIntStep: View {
    @Binding var value: Int
    let unit: String
    let range: ClosedRange<Int>

    var body: some View {
        VStack(spacing: 30) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("\(value)")
                    .font(.system(size: 76, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.terracotta)
                    .monospacedDigit()
                Text(unit)
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }

            VStack(spacing: 6) {
                Slider(
                    value: Binding(
                        get: { Double(value) },
                        set: { value = Int($0) }
                    ),
                    in: Double(range.lowerBound)...Double(range.upperBound),
                    step: 1
                )
                .tint(EatoColor.terracotta)

                HStack {
                    Text("\(range.lowerBound)")
                    Spacer()
                    Text("\(range.upperBound)")
                }
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 20)
    }
}

private struct ActivityStep: View {
    @Bindable var vm: OnboardingViewModel

    var body: some View {
        VStack(spacing: Spacing.sm) {
            ForEach(ActivityLevel.allCases, id: \.self) { level in
                Button {
                    vm.activityLevel = level
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(level.label)
                                .font(.system(size: 16, weight: .heavy, design: .rounded))
                                .foregroundStyle(EatoColor.textPrimary)
                            Text(level.hint)
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(EatoColor.textTertiary)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        vm.activityLevel == level
                            ? EatoColor.terracotta.opacity(0.08)
                            : EatoColor.surface,
                        in: .rect(cornerRadius: 16)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(
                                vm.activityLevel == level ? EatoColor.terracotta : .clear,
                                lineWidth: 2
                            )
                    )
                    .softShadow(elevation: 2)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

/// Final onboarding step. Shows the computed daily budget as a 190dp ring,
/// the BMR + Weekly target stats, and a sage motivational callout.
/// Mirrors `profile.jsx` `summary`.
private struct SummaryStep: View {
    @Bindable var vm: OnboardingViewModel

    var body: some View {
        VStack(spacing: 22) {
            CalorieRing(
                consumed: Int(vm.calorieGoal),
                goal: Int(vm.calorieGoal),
                diameter: 190,
                lineWidth: 14
            )
            .frame(maxWidth: .infinity)
            .padding(.top, 6)

            HStack(spacing: 10) {
                summaryTile(label: "BMR", value: vm.estimatedBMR)
                summaryTile(label: "Weekly", value: vm.weeklyTarget)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Take it one meal at a time.")
                    .font(.system(size: 20, weight: .heavy, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                Text("You can always adjust these later.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(EatoColor.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(EatoColor.sage.opacity(0.14), in: .rect(cornerRadius: 16))
        }
    }

    private func summaryTile(label: String, value: Int) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(EatoColor.textTertiary)
                .kerning(1.0)
            Text("\(value)")
                .font(.system(size: 20, weight: .heavy, design: .rounded))
                .foregroundStyle(EatoColor.textPrimary)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(EatoColor.surface, in: .rect(cornerRadius: 14))
        .softShadow(elevation: 2)
    }
}
