# TODOS

Project-level TODO list. Items grouped by skill/component, then priority (P0 highest, P4 lowest), then a `## Completed` section at the bottom.

## Photo upload pipeline

### Cap presigned PUT size
**Priority:** P1
**Noticed by:** /ship adversarial review on `worktree-shimmering-herding-moore`
**File:** `src/server/services/r2.ts`

The presigned PUT URL has no server-enforced size limit. An authenticated user can call `food.presignPhoto` then PUT a multi-GB body — R2 will accept it and burn storage/egress.

Switch to `createPresignedPost` (from `@aws-sdk/s3-presigned-post`) with `Conditions: [['content-length-range', 0, 5_000_000]]` (5 MB cap). Requires updating the iOS `R2Uploader` to use multipart POST instead of plain PUT — the iOS side currently does `URLSession.upload(for: putRequest, from: data)`. Switching is ~30–40 min CC.

### Rate limit `food.presignPhoto`
**Priority:** P1
**File:** `src/server/routers/food.ts`

`presignPhoto` is `protectedProcedure` only — no per-user throttling. Combined with the missing size cap, an authenticated user can mint URLs in a loop and burn the R2 quota. Add a token-bucket (e.g. 30/hour) at the procedure level. Reuse whatever rate-limit primitive backs the friend-nudge cooldown in `notification.ts`.

### Backfill `dataSource` for pre-encoder-fix entries
**Priority:** P2
**File:** `prisma/schema.prisma` migration

Side-effect of the `Endpoint.swift` `.convertToSnakeCase` removal: before that fix, iOS-sent `dataSource`/`isManualEntry`/`fatSecretId`/`mealType` fields were silently dropped by Zod (snake_case wire keys vs. camelCase schema). Every entry was stored as `dataSource=MANUAL, isManualEntry=false`. Any analytics/UI segmenting on these fields will see a sharp discontinuity at release.

Optional one-off backfill: `prisma.foodEntry.updateMany({ where: { fatSecretId: { not: null }, dataSource: 'MANUAL' }, data: { dataSource: 'FATSECRET' } })`.

## Friends — backend wiring (UI ready, server pending)

### `friend.toggleReaction` mutation
**Priority:** P1
**Files:** `src/server/routers/friend.ts`, `prisma/schema.prisma`, `ios/Eato/Features/Friends/FriendsView.swift`

Phase 7d shipped `PostCard.reactionStrip` with a 6-emoji `ReactionAdder`, but reactions are local-only `@State` in `FeedTab.localReactions` — they reset on every Feed sub-tab dismount. Wire up the backend:

1. New Prisma model `Reaction { id, postId, userId, emoji, createdAt }` with unique constraint on `(postId, userId)` so each user has at most one reaction per post.
2. New mutations `friend.toggleReaction` and `friend.removeReaction`.
3. Add `reactions: { emoji: count } & yourReaction: string | null` to the `FriendFeedItemDTO` payload returned by `friend.getFeed`.
4. Replace `FeedTab.localReactions` `@State` with calls into the view model.

### Persist privacy flags on Profile
**Priority:** P1
**Files:** `prisma/schema.prisma`, `src/server/routers/profile.ts`, `ios/Eato/Features/Friends/FriendsView.swift`

Phase 7d's You tab shows 4 privacy toggles (Auto-share new meals, Show calorie counts, Allow reactions, Discoverable by code only). They're `@State` only — defaults reset on every cold start. Add columns to the `Profile` model and surface them via `profile.upsert`.

Until then, persist with `@AppStorage` so the UI doesn't appear to forget user choices on every cold start.

### Friend avatar streak ring
**Priority:** P3
**Files:** `src/server/routers/friend.ts`, `ios/Eato/Core/Networking/DTOs/FriendDTO.swift`, `ios/Eato/Features/Friends/FriendsView.swift`

Plan 7d called for a primary-color ring around mutual friends' avatars when their streak > 0. `FriendDTO` doesn't have a `currentStreak` field, so this is currently dropped. Add it to the friend.list response payload (joining against `User.currentStreak`) then re-enable the ring rendering.

### Sage-tinted partner/friend nudge card on Today
**Priority:** P2
**File:** `ios/Eato/Features/Dashboard/DashboardView.swift`

Plan 7b mentioned a sage-tinted nudge card showing a recent friend meal on the Today screen. Not implemented. Small visual addition — pull the most recent feed item and render below the SummaryStrip on `isViewingToday`.

## Dashboard — performance

### AsyncImage cache for grid + feed
**Priority:** P1
**Files:** `ios/Eato/Features/Dashboard/Components/StackCard.swift`, `ios/Eato/Features/Friends/FriendsView.swift`

`StackCard` and `PostCard` use bare `AsyncImage(url:)`. SwiftUI's `AsyncImage` does NOT cache — when a cell scrolls out of the `LazyVGrid` window it's destroyed, and scrolling back issues a fresh URLSession request. With 100+ entries and slowish R2 photos this is visible flicker, wasted bandwidth, and battery drain.

Either configure `URLSession.shared.configuration.urlCache` to a 50–100 MB disk+memory cache at app start (cheap, no new deps), or swap to `Kingfisher`/`Nuke` for proper image cache + decode memoization.

### Hoist DateFormatter allocations to module scope
**Priority:** P3
**Files:** `ios/Eato/Features/Dashboard/Components/WeekStrip.swift`, `DashboardViewModel.swift`, `StackCard.swift`, `PostcardOverlay.swift`, `HistoryView.swift`, etc.

~15 sites build a fresh `DateFormatter` on the render path (some inside `Dictionary(grouping:)` closures). DateFormatter is heavyweight to instantiate. Hoist into `static let` or module-level `let` constants — DateFormatter is thread-safe for read use after configuration.

### Cancel stale `setViewedDay` requests + don't clear summary on transient failure
**Priority:** P2
**File:** `ios/Eato/Features/Dashboard/DashboardViewModel.swift`

`loadDailySummary()` (called from `setViewedDay`) has no cancellation. Tapping Friday → Saturday → Sunday in quick succession launches three concurrent fetches; if Friday's response arrives last, it overwrites Saturday's already-applied summary. UI shows Friday data while WeekStrip highlights Saturday.

Hold the in-flight `Task` in the VM and cancel it when `setViewedDay` is called again. Also clear `summary = nil` (or use a separate `viewedSummary` field) so the UI doesn't show a stale day's totals while the new day loads.

## Onboarding

### BMR formula drift risk
**Priority:** P3
**File:** `ios/Eato/Features/Onboarding/OnboardingViewModel.swift`

`estimatedBMR` (used for the Summary step's BMR stat) re-implements Mifflin-St Jeor on the client. No test pins parity with the backend's `calculateBMR` formula. If the backend ever tweaks rounding or adds gender/activity values, the client number silently desyncs from the server-stored value.

Either fetch a preview from `/profile/calculate-bmr-preview` (the endpoint already exists) or snapshot-test the iOS formula against a known backend response.

## Test coverage gaps

### Generate unit tests for remaining Phase 7 view-model logic
**Priority:** P3
**Files:** `ios/EatoTests/`

Testing specialist flagged 13 untested code paths after the Phase 7 redesign — Phase7LogicTests covers ~6 of them (GoalKind, BadgeRarity, BMR, summary step). Remaining gaps:
- `MilestoneBar.progress` (StreaksView)
- `StackCard.tilt` formula
- `CardFront.placeholderTint` hash-based palette (potential negative-modulo concern)
- `CardFront.emojiFor` keyword mapping
- `OnboardingStep.progress` ratio
- `DashboardViewModel.caloriesRemaining`/`hasLoggedAnything`
- `DashboardViewModel.setViewedDay`/`goToToday` (verify URL query param)
- `ProfileViewModel.toggle(_:to:)` optimistic update + reconciliation
- `ProfileViewModel.updateActivityLevel` invalid-Gender silent-no-op path
- `OnboardingViewModel.canAdvance` boundaries for `.body` and `.goal`
- `PostcardOverlay.close()` callback timing contract

Each is small (~3–10 lines per test). Bundle as a follow-up branch.

## Architecture / cleanup

### Consolidate `dayKey` helpers
**Priority:** P3
**Files:** `WeekStrip.swift`, `DashboardViewModel.swift`, `HistoryView.swift`, `LogEntryViewModel.swift`, `RecipeDetailView.swift`, `HistoryDayView.swift`, `WeekViewModel.swift`

7+ inline `DateFormatter()` instances all formatting `yyyy-MM-dd`, with subtle TZ inconsistencies (some UTC, some `Calendar.current`). Extract a single `Date.eato_dayKey(in: TimeZone = .utc)` helper.

### Refactor `*PhotoThenLog` wrappers
**Priority:** P3
**Files:** `FoodSearchView.swift`, `ManualEntryView.swift`, `BarcodeScanView.swift`

Three near-identical wrappers (`SearchPhotoThenLog`, `ManualPhotoThenLog`, `BarcodePhotoThenLog`) chain `PhotoCaptureStep` → `LogEntryView`. Each is ~15 lines, identical except for seed construction. Extract a generic `PhotoThenLog<Seed>(title:makeSeed:onDismiss:)`.

### Unify `compress` helpers
**Priority:** P3
**Files:** `PhotoCaptureStep.swift`, `PhotoAnalyzeViewModel.swift`

Two near-identical JPEG quality-step-down loops with different constants (1 MB target / 0.85→0.2 vs. 1.2 MB / 0.85→0.1). Extract `UIImage.eato_jpegUnderBytes(_:Int)`.

### ProfileView state ownership
**Priority:** P3
**Files:** `ProfileView.swift`, `ProfileViewModel.swift`

`ProfileView` reads `session.currentUser?.profile` directly in 6+ places while mutations go through the VM. Pick one source of truth — either expose `vm.profile` and read from it, or make the VM a pure mutation layer with no local copy.

## Completed

