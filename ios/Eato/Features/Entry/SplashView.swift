import SwiftUI

struct SplashView: View {
    @State private var dotPhase: Int = 0

    var body: some View {
        ZStack {
            EatoColor.terracotta.ignoresSafeArea()

            VStack(spacing: Spacing.xl) {
                Spacer()

                VStack(spacing: Spacing.md) {
                    Text("eato.")
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .kerning(-1)

                    Text("Eat. Track. Together.")
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.85))
                }

                Spacer()

                HStack(spacing: 8) {
                    ForEach(0..<3) { i in
                        Circle()
                            .fill(.white)
                            .frame(width: 8, height: 8)
                            .opacity(dotPhase == i ? 1.0 : 0.35)
                    }
                }
                .padding(.bottom, Spacing.xxl)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever(autoreverses: false)) {
                // Drive a continuous animation; phase advances via Timer below.
            }
            startDotAnimation()
        }
    }

    private func startDotAnimation() {
        Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 350_000_000)
                withAnimation(.easeInOut(duration: 0.3)) {
                    dotPhase = (dotPhase + 1) % 3
                }
            }
        }
    }
}

#Preview {
    SplashView()
}
