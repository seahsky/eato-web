# APNs setup

The iOS client (Phase 8) sends its device token to `POST /notifications/device/ios`.
Routine notification triggers fan out to both Web Push (VAPID) and APNs via
the dispatcher in `src/lib/notifications/sender.ts`. APNs stays *disabled*
until all four env vars below are set, so local dev and web-only
deployments keep working without any changes.

## Environment variables

```env
APN_KEY_ID=XXXXXXXXXX          # 10-char Key ID from https://developer.apple.com/account/resources/authkeys/list
APN_TEAM_ID=YYYYYYYYYY         # 10-char Apple Developer Team ID
APN_BUNDLE_ID=com.eato.app     # Must match the iOS app's bundle identifier
APN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII…\n-----END PRIVATE KEY-----\n"
```

`APN_PRIVATE_KEY` is the contents of the `.p8` file Apple hands you when
you create an APNs auth key. Newlines can be real or `\n`-escaped — the
dispatcher normalises both.

## Installation

When iOS pushes are needed:

```bash
npm install --save-optional @parse/node-apn
```

The import in `src/lib/notifications/apn-push.ts` is lazy, so environments
that skip this install continue to build and run; they just log
`[apn] @parse/node-apn not installed — iOS pushes disabled` on the first
dispatch attempt and return a no-op result.

## How dispatch works

1. A trigger like `notifyPartnerFoodLogged(...)` calls `sendNotificationToUser`.
2. The dispatcher runs Web Push and APNs in parallel (`Promise.all`).
3. Each side queries `PushSubscription` rows filtered by
   `platform == "web"` / `platform == "ios"`.
4. APNs failures that Apple flags as permanently dead (`410 Gone`,
   `BadDeviceToken`, `Unregistered`) cascade-delete the row so the user's
   other devices still receive updates.

## iOS client contract

- iOS requests authorisation via `PushNotificationsManager.requestPermission()`.
- `UIApplicationDelegate.didRegisterForRemoteNotificationsWithDeviceToken`
  hands the raw token to `PushNotificationsManager.didReceive(deviceToken:)`.
- Tokens are persisted to `UserDefaults` keyed by a stable per-install
  `deviceId` (also in `UserDefaults`), so a token rotation updates the
  existing `PushSubscription` rather than creating a duplicate.
- On sign-out we call `/notifications/device/ios/remove` so the server
  stops sending to a device the user is no longer logged in on.
