# iOS port — phase status

Top-level plan: see `docs/google-stitch-prompt.md`-era design doc. This
file tracks what's landed on `feat/ios-native` and what remains.

## Done

| # | Phase | Commit |
|---|---|---|
| 0 | Foundation — Xcode project, APIClient, Clerk, Sign in with Apple | `db1a9f9` |
| 1 | Onboarding wizard + Today dashboard | `c4f97c3` |
| 2 | Logging core — search, barcode, photo, manual | `82010a9` |
| 3 | Week tab + history | `2525b7a` |
| 4 | Recipes — list, builder, detail, log portion | (Phase 4 commit) |
| 5 | Partner — link code, dashboard, approvals, nudges | (Phase 5 commit) |
| 6 | Pet + rest days | (Phase 6 commit) |
| 7 | Meal estimator | (Phase 7 commit) |
| 8a | APNs dispatch (backend) + iOS registration manager | `ed44281` |
| 8b | Deep links (Universal + custom scheme) + actionable approval notifications | (Phase 8 commit) |

## Remaining for true Phase 8 "ship" completion

| Item | Why deferred |
|---|---|
| Live Activity (Lock Screen calorie ring) | Needs a separate WidgetKit extension target in project.yml, a Shared module for the live state struct, and ActivityKit entitlement. Structural work > one session. Plan marked it as stretch. |
| App Store submission assets | Screenshots, privacy labels, app review info — done outside code. |
| Snapshot-test baseline pass on CI | Needs a first `record` run on a real simulator. |

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
   the backend (see `docs/apn-setup.md`). Install
   `npm i --save-optional @parse/node-apn` once configured. Until these
   are set, the dispatcher no-ops silently so web-only pushes keep
   working.

4. **Associated Domains for Universal Links** — host
   `.well-known/apple-app-site-association` on `eato.app` pointing at
   `com.eato.app`, and keep the `applinks:eato.app` entitlement.

5. **Xcode local plugin issue** — on the macOS 26.x / Xcode 16 combo,
   `xcodebuild -resolvePackageDependencies` fails with a
   `DVTDownloads` / `IDESimulatorFoundation` symbol lookup error.
   Running `sudo xcodebuild -runFirstLaunch` fixes it. The CI workflow
   (`.github/workflows/ios.yml`) pins `macos-15` + `Xcode_16.app` which
   does not hit this.

## What's verified vs. what isn't

Verified:
- `npm run openapi:emit` → 82 paths, zero errors
- `npm run build` → Next build succeeds on the full backend diff
- `npx tsc --noEmit` → clean
- `swiftc -parse` → every committed Swift file parses without syntax errors

Not verified (requires infra I don't have access to):
- `xcodebuild build` / `test` (needs working local Xcode or CI)
- Sign in with Apple round-trip (needs real Clerk iOS app + Apple Dev team)
- APN delivery + actionable notification handling (needs real APNs p8 key
  + a device or TestFlight build)
- Universal Links (needs AASA hosted on eato.app)

## Feature-to-tab map

| Tab | Entry point | Built in |
|---|---|---|
| Today | DashboardView | Phase 1 |
| Log | LogHomeView → search/barcode/photo/manual/recipes/meal estimator | Phases 2, 4, 7 |
| Week | WeekView → HistoryDayView | Phase 3 |
| Partner | PartnerHomeView → PartnerLinkView / PartnerDashboardView / PendingApprovalsView | Phase 5 |
| Me | ProfileTabView → PetView / RestDaysView | Phase 6 |

## Deep links

| URL | Routes to |
|---|---|
| `eato://partner` | Partner tab |
| `eato://partner/link/<code>` or `https://eato.app/partner/link/<code>` | Partner tab, pre-fills code in PartnerLinkView |
| `eato://approve/<id>` or `https://eato.app/approve/<id>` | Partner tab → PendingApprovalsView |

Actionable APNs: `PENDING_APPROVAL` category exposes **Approve** /
**Reject** buttons that POST directly from the manager without opening
the app.
