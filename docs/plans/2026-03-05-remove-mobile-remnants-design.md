# Remove Mobile-Native Remnants (Flutter, Vue, Ionic, Expo)

**Date**: 2026-03-05
**Status**: Approved

## Context

Commit `f34d08d` removed 254 files of Flutter, Vue, and Ionic code, but left behind:
- Expo Push notification code and `expo-server-sdk` dependency
- Flutter/Vue permission entries in `.claude/settings.local.json`
- `EXPO_ACCESS_TOKEN` in `.env.example`

This cleanup removes all remaining mobile-native references so the project is a clean Next.js app with Web Push only.

## Changes

### Delete
- `src/lib/notifications/expo-push.ts` — Expo Push implementation (~107 lines)

### Modify
1. **`src/lib/notifications/sender.ts`** — Remove Expo import, remove from `Promise.all`, simplify result aggregation
2. **`src/lib/notifications/index.ts`** — Remove `expo-push` re-export
3. **`src/server/routers/notification.ts`** — Remove `subscribeExpo` procedure, simplify `unsubscribe`
4. **`package.json`** — Remove `expo-server-sdk` dependency
5. **`.env.example`** — Remove `EXPO_ACCESS_TOKEN` lines
6. **`prisma/schema.prisma`** — Remove `EXPO_PUSH` from `TokenType` enum, remove `expoToken` field from `PushSubscription`
7. **`.claude/settings.local.json`** — Remove `Bash(flutter:*)` and `Bash(npx vue-tsc:*)` permissions

### Verification
- Run `npx prisma generate` to verify schema
- Run `npm run build` to verify no build errors
- Confirm Web Push notification code paths are unaffected
