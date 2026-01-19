# Eato Flutter Rewrite Design

## Overview

Rewrite Eato from a Next.js PWA to a Flutter application targeting iOS, Android, and Web from a single codebase. The existing Next.js backend (tRPC + MongoDB + Clerk) will be retained and exposed via OpenAPI.

## Decisions Summary

| Decision | Choice |
|----------|--------|
| Target Platforms | iOS, Android, Web (single codebase) |
| Backend | Keep existing Next.js/tRPC, expose as OpenAPI REST |
| Type Safety | OpenAPI spec + Dart code generation |
| State Management | Riverpod |
| Authentication | Clerk Flutter SDK (beta) |
| Push Notifications | Firebase Cloud Messaging |
| UI Framework | Material 3 |
| Offline Support | Basic caching (view-only), online required for writes |
| Barcode Scanning | Removed |
| CI/CD | Manual builds initially |
| Web Deployment | Replace Next.js frontend entirely, single domain |
| Project Structure | Feature-first architecture |

---

## Architecture

### Tech Stack

- **Frontend**: Flutter 3.x, Dart 3.x
- **State Management**: Riverpod (async state, caching, DI)
- **API Communication**: Generated Dart client from OpenAPI spec
- **Auth**: clerk_flutter + clerk_auth packages
- **Push**: firebase_messaging + firebase_core
- **Local Storage**: Hive (basic offline caching)
- **Charts**: fl_chart (for progress visualization)
- **UI**: Material 3 with custom theme

### Project Structure

```
eato_flutter/
├── lib/
│   ├── core/
│   │   ├── api/              # Generated API client
│   │   ├── router/           # GoRouter navigation
│   │   ├── theme/            # Material 3 theme
│   │   └── utils/            # Shared utilities
│   ├── features/
│   │   ├── auth/
│   │   │   ├── providers/    # Auth state providers
│   │   │   └── screens/      # Login, register
│   │   ├── dashboard/
│   │   │   ├── providers/
│   │   │   ├── screens/
│   │   │   └── widgets/      # Progress ring, meal cards
│   │   ├── food/
│   │   │   ├── providers/
│   │   │   ├── screens/      # Search, log form
│   │   │   └── widgets/      # Food card, entry form
│   │   ├── partner/
│   │   │   ├── providers/
│   │   │   ├── screens/
│   │   │   └── widgets/
│   │   ├── profile/
│   │   │   ├── providers/
│   │   │   ├── screens/
│   │   │   └── widgets/
│   │   ├── recipes/
│   │   │   ├── providers/
│   │   │   ├── screens/
│   │   │   └── widgets/
│   │   └── gamification/
│   │       ├── providers/
│   │       ├── screens/
│   │       └── widgets/      # Streak, badges, celebrations
│   └── main.dart
├── android/
├── ios/
├── web/
├── pubspec.yaml
└── openapi.yaml             # Generated from backend
```

### State Management Pattern

```dart
// Read-only data (like tRPC queries)
final dailySummaryProvider = FutureProvider.family<DailySummary, DateTime>(
  (ref, date) async {
    final api = ref.watch(apiClientProvider);
    return api.stats.getDailySummary(date: date);
  },
);

// Mutations with cache invalidation
class FoodEntryNotifier extends AsyncNotifier<void> {
  Future<void> logFood(FoodEntryInput input) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(apiClientProvider).food.createEntry(input);
      ref.invalidate(dailySummaryProvider);
    });
  }
}
```

---

## Backend Modifications

### Add trpc-openapi

Install and configure to expose tRPC as REST:

```bash
npm install trpc-openapi
```

```ts
// src/lib/openapi.ts
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '@/server/routers';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Eato API',
  version: '1.0.0',
  baseUrl: 'https://eato.app/api',
});
```

### Add OpenAPI Route Handler

```ts
// src/app/api/[...path]/route.ts
import { createOpenApiNextHandler } from 'trpc-openapi';
import { appRouter } from '@/server/routers';
import { createTRPCContext } from '@/server/context';

const handler = createOpenApiNextHandler({
  router: appRouter,
  createContext: createTRPCContext,
});

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
```

### Update Prisma Schema for FCM

```prisma
model PushSubscription {
  // ... existing fields ...

  // Add FCM token support
  fcmToken  String?   @unique
}
```

### Remove Frontend Code

After Flutter Web is ready, remove:
- `src/app/(dashboard)/` - All dashboard pages
- `src/app/(auth)/` - Auth pages (handled by Clerk Flutter)
- `src/components/` - React components
- `src/contexts/` - React contexts
- `src/hooks/` - React hooks

Keep:
- `src/app/api/` - All API routes
- `src/server/` - tRPC routers, services, Prisma
- `src/lib/` - Shared utilities (BMR calc, etc.)
- `prisma/` - Schema and migrations

---

## Deployment Architecture

### Single Domain (eato.app)

```
eato.app
├── /api/trpc/*     → Next.js tRPC handlers
├── /api/webhooks/* → Clerk webhooks, FCM
├── /openapi.json   → OpenAPI spec
└── /*              → Flutter Web static files
```

### Vercel Configuration

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/:path*", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## Screen Inventory

### Navigation

Bottom navigation with 5 items:
1. **Dashboard** - Daily summary, progress
2. **Search** - Food search, favorites
3. **Add (+)** - Log food, quick entry
4. **Partner** - Linking, shared stats
5. **Profile** - Settings, BMR

### Screens by Feature

| Feature | Screen | Description |
|---------|--------|-------------|
| Auth | Login | Clerk sign-in widget |
| Auth | Register | Clerk sign-up widget |
| Dashboard | Home | Daily summary, progress ring, meals |
| Dashboard | Weekly | Week view with chart |
| Food | Search | Search input, results list, favorites |
| Food | Detail | Food nutrition info, serving selector |
| Food | Log | Log food to meal, date picker |
| Food | Edit | Edit existing entry |
| Partner | Link | Generate/enter link code |
| Partner | Stats | Partner's daily/weekly summary |
| Partner | Approvals | Pending approvals list |
| Profile | Settings | User preferences |
| Profile | BMR | BMR/TDEE calculator form |
| Profile | Notifications | Push notification settings |
| Recipes | List | User's recipes |
| Recipes | Detail | Recipe view with nutrition |
| Recipes | Create | Recipe builder form |
| Gamification | Streaks | Streak display, freeze usage |
| Gamification | Achievements | Badge showcase |

---

## Migration Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create Flutter project with structure
- [ ] Add trpc-openapi to Next.js
- [ ] Generate OpenAPI spec
- [ ] Generate Dart API client
- [ ] Implement Clerk authentication
- [ ] Set up Material 3 theme
- [ ] Configure GoRouter navigation

### Phase 2: Core Features (Week 3-5)
- [ ] Dashboard screen with daily summary
- [ ] Progress ring component
- [ ] Food search screen
- [ ] Food entry form
- [ ] Food log screen
- [ ] Profile/BMR calculator

### Phase 3: Partner Features (Week 6-7)
- [ ] Partner linking flow
- [ ] Partner stats view
- [ ] Approval system
- [ ] FCM push notification integration
- [ ] Nudge partner feature

### Phase 4: Polish (Week 8-9)
- [ ] Recipe CRUD
- [ ] Gamification (streaks, badges)
- [ ] Offline caching with Hive
- [ ] Error handling improvements
- [ ] Loading states and animations
- [ ] Performance optimization

### Phase 5: Deployment (Week 10)
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] Flutter Web deployment
- [ ] Remove Next.js frontend code
- [ ] User migration communication

---

## Key Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter

  # State & Architecture
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0
  go_router: ^14.0.0

  # API & Networking
  dio: ^5.4.0
  retrofit: ^4.1.0

  # Auth
  clerk_flutter: ^0.0.13-beta
  clerk_auth: ^0.0.13-beta

  # Push Notifications
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0

  # Local Storage
  hive_flutter: ^1.1.0

  # UI
  fl_chart: ^0.68.0
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0

  # Utilities
  intl: ^0.19.0
  share_plus: ^9.0.0

dev_dependencies:
  build_runner: ^2.4.0
  riverpod_generator: ^2.4.0
  retrofit_generator: ^8.1.0
  hive_generator: ^2.0.0
  openapi_generator: ^5.0.0
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Clerk Flutter SDK is beta | Have WebView fallback ready; monitor for breaking changes |
| Flutter Web performance | Test early; consider CanvasKit renderer for complex animations |
| OpenAPI generation issues | Validate generated spec; may need manual adjustments |
| FCM token management | Test thoroughly on both platforms; handle token refresh |
| App Store review delays | Submit early; follow guidelines carefully |

---

## Success Criteria

1. **Feature Parity**: All current PWA features work in Flutter (except barcode)
2. **Performance**: App startup < 2s, smooth 60fps scrolling
3. **Offline**: Cached data viewable without network
4. **Cross-Platform**: Same codebase works on iOS, Android, Web
5. **User Data**: Zero data loss during migration
6. **App Stores**: Approved on both Apple and Google stores
