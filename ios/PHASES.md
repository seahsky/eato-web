# iOS port — phase status

Top-level plan: see the original `docs/google-stitch-prompt.md`-era design
doc. This file tracks what's landed on `feat/ios-native` and what remains.

## Done

| # | Phase | Commit |
|---|---|---|
| 0 | Foundation — Xcode project, APIClient, Clerk, Sign in with Apple | `db1a9f9` |
| 1 | Onboarding wizard + Today dashboard | `c4f97c3` |
| 2 | Logging core — search, barcode, photo, manual | `82010a9` |
| 3 | Week tab + history | `2525b7a` |
| 8a | APNs dispatch (backend) + iOS registration manager | `ed44281` |

## Remaining

| # | Phase | What |
|---|---|---|
| 4 | Recipes | List, builder, ingredient search, log portion. Uses `recipe.*` + `food.search`. |
| 5 | Partner | Link code entry, partner dashboard, approval queue, pet interactions, nudges. |
| 6 | Pet + gamification polish | Pixel pet, shields, rest days, themes, avatar frames. |
| 7 | Meal estimation | Textarea → parsed breakdown → save. Uses `mealEstimation.*`. |
| 8b | Live Activity + ship | Lock-Screen progress widget, App Store submission. |

## Known blockers requiring user action

1. **Apple Developer team ID** — set in `ios/Config/Local.xcconfig`:
   ```
   DEVELOPMENT_TEAM = XXXXXXXXXX
   CLERK_PUBLISHABLE_KEY = pk_test_…
   ```
   File is gitignored.

2. **Clerk iOS application** — create one in the Clerk dashboard, enable
   Sign in with Apple, allowlist `com.eato.app`.

3. **APNs auth key** — create a `.p8` in the Apple Developer portal; set
   `APN_KEY_ID` / `APN_TEAM_ID` / `APN_BUNDLE_ID` / `APN_PRIVATE_KEY` on
   the backend (see `docs/apn-setup.md`). Until these are set, the
   dispatcher no-ops silently so web-only pushes keep working.

4. **Xcode local plugin issue** — on the macOS 26.x / Xcode 16 combo,
   `xcodebuild -resolvePackageDependencies` fails with a
   `DVTDownloads` / `IDESimulatorFoundation` symbol lookup error.
   Running `sudo xcodebuild -runFirstLaunch` fixes it. The CI workflow
   (`.github/workflows/ios.yml`) pins `macos-15` + `Xcode_16.app` which
   does not hit this.

## What's verified vs. what isn't

Verified:
- `npm run openapi:emit` → 82 paths, zero errors
- `npm run build` → Next build succeeds on the backend diff
- `npx tsc --noEmit` → clean
- `swiftc -parse` → every committed Swift file parses without syntax errors

Not verified (requires infra I don't have access to):
- `xcodebuild build` / `test` (needs working local Xcode or CI)
- Sign in with Apple round-trip (needs real Clerk iOS app + Apple Dev team)
- APN delivery (needs real APNs p8 key + a device or TestFlight)

## How to resume

1. Merge or rebase `feat/ios-native` onto `main`.
2. Pick the next phase from the Remaining table.
3. In a fresh session, run through each phase's router mapping in the
   original plan doc to know which endpoints/DTOs to add.
4. `xcodegen generate` regenerates `Eato.xcodeproj` from
   `ios/project.yml` whenever source files are added.
5. `npm run openapi:emit` after any backend router change; commit
   `docs/openapi.json` so CI (iOS workflow) sees the diff.
