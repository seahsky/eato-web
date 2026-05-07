import SwiftUI

enum AvatarSize {
    case sm, md, lg, xl

    var diameter: CGFloat {
        switch self {
        case .sm: return 28
        case .md: return 40
        case .lg: return 56
        case .xl: return 88
        }
    }

    var fontSize: CGFloat { diameter * 0.42 }
}

struct Avatar: View {
    let initials: String
    var imageURL: URL? = nil
    var size: AvatarSize = .md
    var tint: Color = EatoColor.terracotta

    var body: some View {
        Group {
            if let imageURL {
                AsyncImage(url: imageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: size.diameter, height: size.diameter)
        .clipShape(Circle())
        .overlay(
            Circle().stroke(EatoColor.surface, lineWidth: 2)
        )
    }

    private var placeholder: some View {
        ZStack {
            tint.opacity(0.18)
            Text(initials.prefix(2).uppercased())
                .font(.system(size: size.fontSize, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
        }
    }
}

#Preview {
    HStack(spacing: 12) {
        Avatar(initials: "KS", size: .sm)
        Avatar(initials: "KS", size: .md)
        Avatar(initials: "KS", size: .lg, tint: EatoColor.sage)
        Avatar(initials: "KS", size: .xl)
    }
    .padding()
    .background(EatoColor.background)
}
