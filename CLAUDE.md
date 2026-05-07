# Eato - Claude Code Configuration

## Development Rules

### Code Quality Principles
- **DRY (Don't Repeat Yourself)**: Extract shared logic into reusable functions, hooks, or components. If you find yourself writing similar code twice, abstract it.
- **KISS (Keep It Simple, Stupid)**: Prefer straightforward solutions over clever complexity. Code should be readable and maintainable.

### Pre-Submission Checklist
- Always run type checking before completing any task
- Run `npm run build` to verify no build errors
- Fix all TypeScript errors and warnings before handing in work

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

Eato is a mobile-first calorie tracking app for couples to track their daily calorie intake and reach health goals together. The app features a Next.js frontend and API backend in a single application.

### Core Features
- Calorie tracking with FatSecret food database search and manual entry
- BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure) calculator
- Recipe builder with per-100g nutrition calculation
- Friends: many-to-many connections via 6-char codes; read-only feed of friends' meals
- Push notifications (Web Push + APNs)
- Gamification system (streaks, achievements across consistency/logging/goals/social, rest days)
- Daily and weekly statistics with visual progress indicators

---

## Project Structure

```
eato/
├── src/
│   ├── app/               # Next.js App Router (pages + API routes)
│   ├── server/            # tRPC routers and services
│   ├── lib/               # Shared utilities
│   └── trpc/              # tRPC client configuration
├── prisma/                # Database schema
├── Dockerfile             # Production build
└── docs/                  # Additional documentation
```

---

## Tech Stack

### Next.js App

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

### Deployment

| Component | Technology |
|-----------|------------|
| Container | Docker build |
| Runtime | Node.js 20 Alpine |
| Port | 8080 (Next.js) |

---

## System Logic

### Authentication Flow
- Clerk manages all user authentication (OAuth providers and email/password)
- A webhook endpoint receives Clerk lifecycle events (user created, updated, deleted)
- On user creation in Clerk, a corresponding user record is created in MongoDB
- On user deletion, Friendship rows cascade-delete via Prisma `onDelete: Cascade`, then the user record is removed
- All tRPC procedures marked as protected require both valid Clerk authentication AND an existing database user record

### Data Model Relationships
- **User**: Central entity linked to Clerk via clerkId. Contains gamification stats and notification settings.
- **Profile**: One-to-one with User. Stores physical metrics, calculated BMR/TDEE, calorie goal, and display preferences.
- **FoodEntry**: Many-to-one with User and DailyLog. Individual food items with full nutritional data.
- **DailyLog**: Many-to-one with User. Aggregated daily totals with unique constraint on userId + date.
- **Recipe**: Many-to-one with User. Custom recipes with ingredients and per-100g nutrition.
- **Achievement**: Many-to-one with User. Unlocked badges and milestones.
- **PushSubscription**: Many-to-one with User. Web Push or APNs tokens per device.
- **Friendship**: One row per pair (userAId < userBId), status PENDING/ACCEPTED. Cascade-deletes on either side.
- **FriendCode**: Personal redeemable code for a user (24h TTL). One active code per user.

### Friend System Logic
- Users generate a 6-character alphanumeric friend code (expires in 24 hours; one active per user)
- When another user enters that code, a Friendship row is created with status=ACCEPTED (no separate request/accept step)
- Friends are read-only: they can see each other's logged meals via the friend feed but cannot log food on each other's behalf
- Friends can nudge each other (rate-limited to once per 4 hours per pair)
- Removing a friend deletes the Friendship row regardless of status

### Food Logging Logic
- Food entries originate from: FatSecret database search, barcode scan, manual entry, or recipes
- DailyLog totals are atomically incremented/decremented when entries are created/updated/deleted
- Entries are owner-only: a user can only log/edit/delete their own entries

### Gamification System
- **Daily Streaks**: Consecutive days with at least one logged entry
- **Goal Streaks**: Consecutive days meeting calorie goal
- **Weekly Streaks**: Logging on 5+ days per week
- **Streak Freezes**: Earned every 7 days; can save a missed day (max 2 banked)
- **Achievements/Badges**: Unlocked for milestones across consistency, logging, goals, and social categories
- **Rest Days**: Users can declare up to 6 rest days per month (streak protection)

### API Router Structure
- **health**: Health check endpoints for container monitoring
- **auth**: Current user with profile (`getMe`)
- **friend**: Generate/accept/remove friend codes, list friends, paginated friend feed
- **profile**: Profile CRUD, BMR/TDEE calculations, calorie goal updates, energy unit preferences
- **food**: FatSecret search, barcode lookup, food entry CRUD, favorites, recents, frequents
- **stats**: Daily/weekly summaries with meal breakdown, streak data, rest days
- **recipe**: Recipe CRUD with ingredient management and nutrition calculation
- **notification**: Push subscription management, friend-gated nudges, friend* notification settings
- **mealEstimation**: Meal calculator for estimating nutrition from ingredient list
- **achievements**: Badge queries and unlock checking, theme/avatar-frame customization

### Data Flow Patterns
- tRPC client fetches data from API routes
- API returns JSON via tRPC or REST endpoints
- React Server Components and client components handle rendering
- Mutations trigger cache invalidation to sync state

### External Integrations
- **Clerk**: Authentication with webhook sync for user lifecycle
- **FatSecret**: Primary food database API (OAuth 2.0)
- **Firebase**: Push notifications for web
- **Google Translate**: Non-English food search translation
- **MongoDB**: Document database via Prisma ORM

---

## Deployment

### Dockerfile Architecture
The app uses a Docker build:
1. **Stage 1 (build)**: Installs deps, generates Prisma client, builds Next.js
2. **Stage 2 (runtime)**: Copies build artifacts, runs Next.js on port 8080

### Required Environment Variables

#### Runtime (Container ENV)
```env
DATABASE_URL=mongodb+srv://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
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
