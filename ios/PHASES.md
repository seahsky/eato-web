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
| 5 | Partner — link code, dashboard, approvals, nudges | (Phase 5 commit) — **superseded by Friends rewrite, see redesign phases below** |
| 6 | Pet + rest days | (Phase 6 commit) — **Pet UI deleted in redesign Phase 5** |
| 7 | Meal estimator | (Phase 7 commit) |
| 8a | APNs dispatch (backend) + iOS registration manager | `ed44281` |
| 8b | Deep links (Universal + custom scheme) + actionable approval notifications | (Phase 8 commit) — **approval actions removed in redesign Phase 5** |

## Eato redesign — phase status (current)

Top-level plan: 7-phase redesign to retro.app-style chronological diary, drop Pet, replace 1:1 Partner with many-to-many Friend.

| # | Phase | Commit |
|---|---|---|
| 0 | Design foundation — brand palette, 8 primitives, softShadow | `43b4612` |
| 1 | Backend — drop Pet, Partner→Friend, drop approval flow, migration script | `b87b093` |
| 2 | Splash + Sign-in restyle + Onboarding pre-fill | `3ec4da3` |
| 3 | Diary timeline + postcard overlay + summary strip + quick chips | `47e62ba` |
| 4 | AddFood + Insight (Weekly Charts, History calendar, Streaks badges) | `a2427d9` |
| 5 | Friends UI (Feed/Friends/You) + delete Partner/Pet UI | `29410c8` |
| 6 | ProfileView + final cleanup | `58e05e9` |
| 7a | Photo-required logging — R2 presign endpoint, `R2Uploader`, `PhotoCaptureStep` wired into Search / Manual / Barcode / Photo paths; encoder fix (drop `.convertToSnakeCase` so multi-word fields like `imageUrl` actually reach the backend) | _pending_ |
| 7b | Dashboard rewrite — 3-col `LazyVGrid` of `StackCard` photo tiles + `AddCard`, tappable `WeekStrip`, "Back to today" pill, `PostcardOverlay` 3D flip, redesigned `SummaryStrip`, `DashboardViewModel.viewedDay` for arbitrary-date browsing. Deletes `EntryCard` + `QuickChips` (filter chips superseded by reverse-chrono grid). | _pending_ |
| 7c | Insight polish — Weekly: 200dp ring, 2-col stat tiles, sage motivational banner. History: streak summary card + month sections + expandable `DayRow` (replaces calendar grid). Streaks: terracotta gradient hero with `TimelineView`-driven flame flicker, milestone bar (7 / 30 / 90 / 365), category chips, 3-col badge grid with rarity tints + glow. New `BadgeRarity.swift` + `BadgeDTO.rarity/icon` (custom decoder accepts both `icon` and legacy `emoji`). | _pending_ |
| 7d | Profile + Friends + Onboarding refinements — Profile: gradient avatar header, 3-tile stats grid (BMR/TDEE/Week), Lose/Maintain/Gain pills (TDEE-relative), 4-radio activity card (calls `profile.upsert`), 4 nudge toggles, "made with warmth · v1.0" footer. Friends: PostCard with reaction strip + ReactionAdder (UI-only — backend `friend.toggleReaction` deferred), gradient code card with Copy/Share, 3-tile You stats, 4 privacy toggles (UI-only — backend privacy flags deferred), AddFriendSheet. Onboarding: new Summary step (190dp ring + BMR + Weekly + sage callout) — submits on Continue. New `ProfileAPI.upsert` + iOS `GoalKind` enum. | _pending_ |
| 8a | Brand assets + Entry restyle — new `EatoLeafBowl` SVG view (terracotta on white for splash, white on terracotta for sign-in). Splash: 124pt white container w/ scale-in animation, 38pt heavy `eato` wordmark, "a kinder food diary" tagline. Sign-in: 76pt terracotta tile + white leaf-bowl, two-line "Welcome to / eato." headline, new sub-tagline ("A kinder food diary. Take a photo, write a line, move on with your day."), 54pt h × 14pt-radius OAuth buttons. | _pending_ |
| 8b | 4-tab restructure — drop the dedicated `.log` tab, switch to design "Set C" icons (`book.closed.fill` / `calendar` / `sparkles` / `person.crop.circle.fill`). `DashboardView` no longer takes an `onCompose` callback; `AddCard` taps now drive a `.fullScreenCover` of `AddFoodView`. `AddFoodView` gains a leading-toolbar close button + `@Environment(\.dismiss)`. | _pending_ |
| 8c | Onboarding 5→6 step refactor — split into single-field steps `gender / height / weight / age / activity / summary`. `BigNumberStep` with slider for height (120-220 cm), weight (35-160 kg), age (14-90 yr). Gender 2×2 pill grid (female / male / non-binary / rather not say). Drop the manual goal-edit step — daily budget is computed from BMR + activity and shown only on the summary (still editable from Profile). New `Gender` cases serialize as `FEMALE` on the wire to keep the backend's `MALE`/`FEMALE` Zod gate happy. Tests refactored to match. | _pending_ |
| 8d | Pixel polish — new `Toast` component (1.1s auto-dismiss) shown after a successful `AddFood` save; auto-dismisses the AddFood sheet on completion. Postcard ruled-paper background, 66pt profile avatar, "made with warmth · v1.0" footer all already shipped in 7d — re-verified for parity. Custom font registration (Nunito / JetBrains Mono) deferred per plan. | _pending_ |

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
| Today | DashboardView (timeline + postcard overlay) | Redesign Phase 3 |
| Log | AddFoodView → search/barcode/photo/manual/recipes/meal estimator | Redesign Phase 4 |
| Insight | InsightView → WeeklyView (Charts) / HistoryView (calendar) / StreaksView (badges) | Redesign Phase 4 |
| Friends | FriendsView (Feed/Friends/You) | Redesign Phase 5 |
| Me | ProfileView | Redesign Phase 6 |

## Deep links

| URL | Routes to |
|---|---|
| `eato://friends` | Friends tab |
| `eato://friends/add/<code>` or `https://eato.app/friends/add/<code>` | Friends tab → You sub-tab, pre-fills code |

Actionable APNs were removed with the approval-flow rewrite. Notifications
now route via the `url` payload field (or fall back to opening the app).
