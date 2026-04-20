# Eato iOS

Native SwiftUI client for the Eato calorie-tracking app, targeting iOS 17+.
Lives in the eato-web monorepo so the committed OpenAPI spec at
`../docs/openapi.json` is always in sync with the backend that emits it.

## Prerequisites

- Xcode 16 or later
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) — `brew install xcodegen`
- Apple Developer account (for Sign in with Apple, APNs, device builds)
- A running Eato backend on `http://localhost:3000` (or override `API_BASE_URL` — see below)

## One-time setup

```bash
cd ios

# 1. Provide your real Apple Team ID + Clerk keys (gitignored).
cat > Config/Local.xcconfig <<'EOF'
DEVELOPMENT_TEAM = XXXXXXXXXX
CLERK_PUBLISHABLE_KEY = pk_test_YOUR_REAL_KEY
EOF

# 2. Generate the Xcode project from project.yml.
xcodegen generate

# 3. Regenerate Swift types from the backend OpenAPI spec.
./scripts/gen-openapi.sh

open Eato.xcodeproj
```

## Running the backend alongside

```bash
# in repo root
npm run openapi:emit   # regenerate docs/openapi.json
npm run dev            # Next.js on :3000
```

For physical-device testing, set `API_BASE_URL` in `Config/Local.xcconfig` to
your LAN IP (e.g. `http:/$()/192.168.1.42:3000/api/rest`) and add
`NSAppTransportSecurity` exceptions if you must use HTTP.

## Regenerating API types

Whenever a backend router changes:

```bash
# From repo root
npm run openapi:emit

# From ios/
./scripts/gen-openapi.sh
```

`gen-openapi.sh` runs swift-openapi-generator through a tiny SPM tool package
(`Codegen/`) and writes sources to `Eato/Core/Networking/Generated/`.

## Sign in with Apple

Requires:
- `Sign in with Apple` capability enabled in the App ID
- A Clerk **iOS** application configured in the Clerk dashboard with:
  - Sign in with Apple enabled
  - This app's bundle ID (`com.eato.app`) allowlisted
- `CLERK_PUBLISHABLE_KEY` in `Config/Local.xcconfig`

## Push notifications

Added in Phase 8. Requires an APNs p8 key configured on the backend and the
`aps-environment` entitlement (already set to `development` in `project.yml`).

## Structure

```
Eato/
  App/                 EatoApp, RootView, Info.plist, entitlements
  Core/
    Networking/        APIClient, Endpoint, AuthInterceptor, ErrorMapper
    Auth/              ClerkSession, SessionStore, SignInWithApple
    Persistence/       SwiftData models (added in Phase 1)
    DesignSystem/      Colors, Typography, Spacing, shared components
  Features/            Feature folders by phase (Onboarding, Dashboard, ...)
  Resources/           Assets.xcassets
EatoTests/             XCTest + snapshot tests
Codegen/               swift-openapi-generator tool package
Config/                xcconfig files
scripts/               Shell helpers (gen-openapi.sh)
```
