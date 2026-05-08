import SwiftUI

/// Full-bleed terracotta splash. White rounded container holds the
/// `EatoLeafBowl` mark, scales in via a custom timing curve, then the
/// wordmark and tagline fade in. Loader dots pulse along the bottom.
/// Mirrors `entry.jsx` `SplashScreen`.
struct SplashView: View {
    @State private var dotPhase: Int = 0
    @State private var didAppear: Bool = false

    var body: some View {
        ZStack {
            EatoColor.terracotta.ignoresSafeArea()

            // Soft radial highlight (matches `radial-gradient` in design).
            RadialGradient(
                colors: [.white.opacity(0.18), .clear],
                center: UnitPoint(x: 0.5, y: 0.38),
                startRadius: 0,
                endRadius: 320
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo container — white rounded square w/ leaf-bowl mark.
                ZStack {
                    RoundedRectangle(cornerRadius: 36)
                        .fill(.white)
                        .frame(width: 124, height: 124)
                        .shadow(color: .black.opacity(0.28), radius: 30, x: 0, y: 24)

                    EatoLeafBowl(fill: EatoColor.terracotta, size: 64)
                }
                .scaleEffect(didAppear ? 1.0 : 0.7)
                .opacity(didAppear ? 1.0 : 0.0)

                Text("eato")
                    .font(.system(size: 38, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .kerning(-0.5)
                    .padding(.top, 22)
                    .opacity(didAppear ? 1.0 : 0.0)
                    .offset(y: didAppear ? 0 : 6)

                Text("a kinder food diary")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.78))
                    .padding(.top, 6)
                    .opacity(didAppear ? 1.0 : 0.0)
                    .offset(y: didAppear ? 0 : 6)

                Spacer()

                HStack(spacing: 8) {
                    ForEach(0..<3) { i in
                        Circle()
                            .fill(.white.opacity(0.85))
                            .frame(width: 7, height: 7)
                            .scaleEffect(dotPhase == i ? 1.0 : 0.6)
                            .opacity(dotPhase == i ? 1.0 : 0.4)
                    }
                }
                .padding(.bottom, 80)
            }
        }
        .onAppear {
            // 600ms cubic-bezier(.2,.9,.3,1.2) — a slight overshoot.
            withAnimation(.timingCurve(0.2, 0.9, 0.3, 1.2, duration: 0.6)) {
                didAppear = true
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
