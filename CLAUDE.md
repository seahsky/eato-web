# Eato - Claude Code Configuration

## Development Rules

### Code Quality Principles
- **DRY (Don't Repeat Yourself)**: Extract shared logic into reusable functions, hooks, or components. If you find yourself writing similar code twice, abstract it.
- **KISS (Keep It Simple, Stupid)**: Prefer straightforward solutions over clever complexity. Code should be readable and maintainable.

### Pre-Submission Checklist
- Always run type checking before completing any task
- For API: Run `npm run build` in `apps/api` to verify no build errors
- For Flutter: Run `flutter analyze` in `apps/client` to verify no lint errors
- Fix all TypeScript/Dart errors and warnings before handing in work

### Bug Investigation Protocol
- When asked to fix a bug or issue, **find the root cause first**
- Do not apply surface-level patches without understanding why the issue occurs
- Trace the data flow and execution path to identify the actual source of the problem
- Document your findings before implementing a fix

## Git Workflow

### Session Isolation
- Use a new git worktree for every new session
- This ensures clean separation between concurrent work streams
- Prevents conflicts and maintains isolated development environments

---

## Project Overview

Eato is a mobile-first cross-platform app for couples to track their daily calorie intake and reach health goals together. The app features a Flutter frontend (iOS, Android, Web) with a Next.js API backend.

### Core Features
- Calorie tracking with FatSecret food database search and manual entry
- BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure) calculator
- Recipe builder with per-100g nutrition calculation
- Partner mode for linking accounts and viewing shared progress
- Partner food logging with approval workflow
- Push notifications (Firebase Cloud Messaging + Web Push)
- Gamification system (streaks, achievements, partner shields)
- Daily and weekly statistics with visual progress indicators

---

## Monorepo Structure

```
eato/
├── apps/
│   ├── api/                   # Next.js backend (tRPC + REST API)
│   │   ├── src/
│   │   │   ├── app/api/       # API routes (tRPC, REST, webhooks, cron)
│   │   │   ├── server/        # tRPC routers and services
│   │   │   ├── lib/           # Shared utilities
│   │   │   └── trpc/          # tRPC client configuration
│   │   └── prisma/            # Database schema
│   └── client/                # Flutter app (iOS, Android, Web)
│       ├── lib/
│       │   ├── core/          # Shared infrastructure
│       │   │   ├── api/       # API client, models, interceptors
│       │   │   ├── auth/      # Clerk authentication wrappers
│       │   │   ├── router/    # GoRouter configuration
│       │   │   └── theme/     # App theming
│       │   └── features/      # Feature modules
│       │       ├── auth/      # Login screens and providers
│       │       ├── dashboard/ # Home screen and stats
│       │       ├── food/      # Food search, add, edit
│       │       ├── profile/   # Profile setup and settings
│       │       ├── partner/   # Partner linking and tracking
│       │       ├── recipes/   # Recipe builder
│       │       ├── gamification/   # Streaks and badges
│       │       └── notifications/  # Push notification settings
│       └── web/               # Flutter web assets
├── Dockerfile                 # Multi-stage build (Flutter + Next.js)
├── nginx.conf                 # Nginx reverse proxy config
├── start.sh                   # Container startup script
└── docs/                      # Additional documentation
```

---

## Tech Stack

### Backend (apps/api/)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| API | tRPC + trpc-openapi (REST endpoints) |
| Database | MongoDB with Prisma ORM |
| Authentication | Clerk (webhooks for user sync) |
| Push Notifications | Web Push (VAPID) + Expo Push |
| Food Database | FatSecret Platform API |
| Translation | Google Cloud Translation API |
| Validation | Zod |
| Job Scheduling | Agenda (MongoDB-backed) |

### Frontend (apps/client/)

| Layer | Technology |
|-------|------------|
| Framework | Flutter 3 (iOS, Android, Web) |
| State Management | Riverpod + riverpod_generator |
| Navigation | GoRouter |
| HTTP Client | Dio with interceptors |
| Authentication | clerk_flutter (native) + JS interop (web) |
| Push Notifications | Firebase Cloud Messaging |
| Local Storage | Hive + SharedPreferences + SecureStorage |
| Charts | fl_chart |

### Deployment

| Component | Technology |
|-----------|------------|
| Container | Docker multi-stage build |
| Web Server | Nginx (serves Flutter, proxies API) |
| Runtime | Node.js 20 Alpine |
| Port | 8080 (Nginx) → 3000 (Next.js internal) |

---

## System Logic

### Authentication Flow
- Clerk manages all user authentication (OAuth providers and email/password)
- Flutter uses `clerk_flutter` package for native apps, JS interop for web
- A webhook endpoint receives Clerk lifecycle events (user created, updated, deleted)
- On user creation in Clerk, a corresponding user record is created in MongoDB
- On user deletion, the system first unlinks any partner relationship, then cascades deletion to all related data
- All tRPC procedures marked as protected require both valid Clerk authentication AND an existing database user record

### Data Model Relationships
- **User**: Central entity linked to Clerk via clerkId. Contains partner linking, gamification stats, and notification settings.
- **Profile**: One-to-one with User. Stores physical metrics, calculated BMR/TDEE, calorie goal, and display preferences.
- **FoodEntry**: Many-to-one with User and DailyLog. Individual food items with full nutritional data and approval status.
- **DailyLog**: Many-to-one with User. Aggregated daily totals with unique constraint on userId + date.
- **Recipe**: Many-to-one with User. Custom recipes with ingredients and per-100g nutrition.
- **Achievement**: Many-to-one with User. Unlocked badges and milestones.
- **PushSubscription**: Many-to-one with User. Web Push or Expo Push tokens per device.

### Partner System Logic
- Users generate a 6-character alphanumeric partner link code (expires in 24 hours)
- When User B enters User A's code, bidirectional linking occurs
- Partners can log food for each other (requires approval workflow)
- Partners can view each other's daily and weekly summaries
- Partner shields can protect a partner's streak from breaking

### Food Logging Logic
- Food entries originate from: FatSecret database search, barcode scan, manual entry, or recipes
- DailyLog totals are atomically incremented/decremented when entries are created/updated/deleted
- Partner-logged entries start with PENDING approval status
- Approved entries count toward daily totals; rejected entries are excluded

### Gamification System
- **Daily Streaks**: Consecutive days with at least one logged entry
- **Goal Streaks**: Consecutive days meeting calorie goal
- **Weekly Streaks**: Logging on 5+ days per week
- **Partner Shields**: Protect partner's streak (2 per month)
- **Achievements/Badges**: Unlocked for milestones (first entry, week warrior, etc.)
- **Rest Days**: Users can declare up to 6 rest days per month (streak protection)

### API Router Structure
- **health**: Health check endpoints for container monitoring
- **auth**: Partner code generation, linking/unlinking, current user with profile
- **profile**: Profile CRUD, BMR/TDEE calculations, calorie goal updates
- **food**: FatSecret search, barcode lookup, food entry CRUD, favorites, partner logging
- **stats**: Daily/weekly summaries with meal breakdown, partner summaries
- **recipe**: Recipe CRUD with ingredient management and nutrition calculation
- **notification**: Push subscription management, nudges, reminder settings
- **mealEstimation**: Meal calculator for estimating nutrition from ingredient list
- **achievements**: Badge queries and unlock checking

### Flutter Architecture
- **Feature-based structure**: Each feature module contains screens, providers, and widgets
- **Riverpod providers**: State management with code generation for type safety
- **GoRouter**: Declarative navigation with route guards for authentication
- **Dio interceptors**: Automatic auth token injection and refresh
- **Platform-specific code**: Conditional imports for web vs native (Clerk, notifications)

### Data Flow Patterns
- Riverpod providers fetch data via Dio HTTP client
- API returns JSON parsed into Dart model classes
- Provider state drives UI rebuilds
- Mutations trigger provider refresh to sync state
- Optimistic updates for better UX where appropriate

### External Integrations
- **Clerk**: Authentication with webhook sync for user lifecycle
- **FatSecret**: Primary food database API (OAuth 2.0)
- **Firebase**: Push notifications for iOS/Android/Web
- **Google Translate**: Non-English food search translation
- **MongoDB**: Document database via Prisma ORM

---

## Deployment

### Dockerfile Architecture
The app uses a multi-stage Docker build:
1. **Stage 1 (flutter-build)**: Builds Flutter web app with environment variables
2. **Stage 2 (nextjs-build)**: Builds Next.js API with Prisma generation
3. **Stage 3 (runtime)**: Combines both into a production container

### Container Services
- **Nginx** (port 8080): Serves Flutter static files, proxies `/api/*` to Next.js
- **Next.js** (port 3000 internal): Runs API server with Prisma client

### Required Environment Variables

#### Build-time (Dockerfile ARGs)
```env
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_VAPID_KEY
CLERK_PUBLISHABLE_KEY
DEBUG=false
```

#### Runtime (Container ENV)
```env
DATABASE_URL=mongodb+srv://...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
FATSECRET_CLIENT_ID=...
FATSECRET_CLIENT_SECRET=...
GOOGLE_TRANSLATE_API_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### Health Check
- Endpoint: `GET /api/rest/health`
- Returns: `{ "status": "ok", "timestamp": "...", "uptime": "..." }`
