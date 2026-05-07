import SwiftUI

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
            OnboardingProgressBar(progress: vm.step.progress)
                .padding(.horizontal, Spacing.lg)
                .padding(.top, Spacing.lg)

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.xl) {
                    Text(vm.step.title)
                        .font(Typography.titleLarge)
                        .foregroundStyle(EatoColor.textPrimary)
                        .padding(.top, Spacing.xl)

                    switch vm.step {
                    case .basics: BasicsStep(vm: vm)
                    case .body: BodyStep(vm: vm)
                    case .activity: ActivityStep(vm: vm)
                    case .goal: GoalStep(vm: vm)
                    }

                    if let errorMessage = vm.errorMessage {
                        Text(errorMessage)
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.danger)
                    }
                }
                .padding(.horizontal, Spacing.lg)
            }

            VStack(spacing: Spacing.sm) {
                PrimaryButton(
                    vm.step == .goal ? "Finish" : "Continue",
                    isLoading: vm.isSaving
                ) {
                    Task { await vm.advance() }
                }
                .disabled(!vm.canAdvance || vm.isSaving)

                if vm.step != .basics {
                    Button("Back", action: vm.goBack)
                        .font(Typography.bodyMedium)
                        .foregroundStyle(EatoColor.textSecondary)
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xl)
        }
        .background(EatoColor.background)
    }
}

private struct OnboardingProgressBar: View {
    let progress: Double

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: Radius.pill)
                    .fill(EatoColor.divider)
                RoundedRectangle(cornerRadius: Radius.pill)
                    .fill(EatoColor.accent)
                    .frame(width: geo.size.width * progress)
                    .animation(.easeOut, value: progress)
            }
        }
        .frame(height: 4)
    }
}

private struct BasicsStep: View {
    @Bindable var vm: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            SteppedNumberField(label: "Age", value: $vm.age, range: 13...120)
            GenderPicker(selection: $vm.gender)
        }
    }
}

private struct BodyStep: View {
    @Bindable var vm: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            DecimalField(label: "Weight (kg)", value: $vm.weightKg, range: 20...500)
            DecimalField(label: "Height (cm)", value: $vm.heightCm, range: 50...300)
        }
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
                        VStack(alignment: .leading, spacing: Spacing.xxs) {
                            Text(level.label)
                                .font(Typography.titleSmall)
                                .foregroundStyle(EatoColor.textPrimary)
                            Text(level.hint)
                                .font(Typography.caption)
                                .foregroundStyle(EatoColor.textSecondary)
                        }
                        Spacer()
                        if vm.activityLevel == level {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(EatoColor.accent)
                        }
                    }
                    .padding(Spacing.md)
                    .background(
                        vm.activityLevel == level
                            ? EatoColor.surface
                            : Color.clear,
                        in: .rect(cornerRadius: Radius.md)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md)
                            .stroke(EatoColor.divider)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct GoalStep: View {
    @Bindable var vm: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            if let suggested = vm.suggestedGoal {
                Card {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("Suggested daily goal")
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.textSecondary)
                        Text("\(Int(suggested)) kcal")
                            .font(Typography.titleMedium)
                            .foregroundStyle(EatoColor.terracotta)
                            .monospacedDigit()
                        Text("Based on your BMR and activity.")
                            .font(Typography.caption)
                            .foregroundStyle(EatoColor.textSecondary)
                    }
                }
            }
            DecimalField(label: "Daily calorie goal", value: $vm.calorieGoal, range: 1000...10000)
        }
    }
}

// MARK: - Form fields

private struct SteppedNumberField: View {
    let label: String
    @Binding var value: Int
    let range: ClosedRange<Int>

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.caption)
                .foregroundStyle(EatoColor.textSecondary)
            HStack {
                Button { value = max(range.lowerBound, value - 1) } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(EatoColor.terracotta)
                }
                Spacer()
                Text("\(value)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(EatoColor.textPrimary)
                    .monospacedDigit()
                Spacer()
                Button { value = min(range.upperBound, value + 1) } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(EatoColor.terracotta)
                }
            }
            .padding(Spacing.md)
            .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
        }
    }
}

private struct DecimalField: View {
    let label: String
    @Binding var value: Double
    let range: ClosedRange<Double>

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(Typography.caption)
                .foregroundStyle(EatoColor.textSecondary)
            TextField(label, value: $value, format: .number.precision(.fractionLength(0...1)))
                .keyboardType(.decimalPad)
                .font(Typography.titleMedium)
                .foregroundStyle(EatoColor.textPrimary)
                .tint(EatoColor.terracotta)
                .padding(Spacing.md)
                .background(EatoColor.surface, in: .rect(cornerRadius: Radius.md))
                .onChange(of: value) { _, new in
                    if new < range.lowerBound { value = range.lowerBound }
                    if new > range.upperBound { value = range.upperBound }
                }
        }
    }
}

private struct GenderPicker: View {
    @Binding var selection: Gender

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text("Gender")
                .font(Typography.caption)
                .foregroundStyle(EatoColor.textSecondary)
            HStack(spacing: 4) {
                ForEach(Gender.allCases, id: \.self) { g in
                    Button {
                        withAnimation(.smooth(duration: 0.18)) { selection = g }
                    } label: {
                        Text(g.label)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(
                                selection == g ? EatoColor.accentContrast : EatoColor.textSecondary
                            )
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                selection == g ? EatoColor.terracotta : Color.clear,
                                in: Capsule()
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(4)
            .background(EatoColor.surface, in: Capsule())
        }
    }
}
