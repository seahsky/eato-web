// swift-tools-version:5.10
import PackageDescription

// Tool-only package. Its only job is to pin swift-openapi-generator so that
// scripts/gen-openapi.sh can invoke it deterministically without a global install.
let package = Package(
    name: "EatoCodegen",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(
            url: "https://github.com/apple/swift-openapi-generator",
            from: "1.4.0"
        )
    ],
    targets: []
)
