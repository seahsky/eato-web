# Eato - Claude Code Configuration

## Development Rules

### Code Quality Principles
- **DRY (Don't Repeat Yourself)**: Extract shared logic into reusable functions, hooks, or components. If you find yourself writing similar code twice, abstract it.
- **KISS (Keep It Simple, Stupid)**: Prefer straightforward solutions over clever complexity. Code should be readable and maintainable.

### Pre-Submission Checklist
- Always run type checking before completing any task
- Always run `npm run build` to verify there are no build errors
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

Eato is a mobile-first Progressive Web App (PWA) designed for couples to track their daily calorie intake and reach health goals together. The app combines personal diet tracking with partner collaboration features.

### Core Features
- Calorie tracking with food database search and manual entry
- BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure) calculator
- Partner mode for linking accounts and viewing shared progress
- Daily and weekly statistics with visual progress indicators
- PWA installation with offline support

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| API | tRPC with protected procedures |
| Database | MongoDB with Prisma ORM |
| Authentication | Clerk with webhook sync |
| UI Components | shadcn/ui, Radix UI primitives |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| State Management | TanStack React Query |
| PWA | Serwist (Service Worker) |
| External API | Open Food Facts |
| Validation | Zod |

---

## System Logic

### Authentication Flow
- Clerk manages all user authentication (OAuth providers and email/password)
- A webhook endpoint receives Clerk lifecycle events (user created, updated, deleted)
- On user creation in Clerk, a corresponding user record is created in MongoDB
- On user deletion, the system first unlinks any partner relationship, then cascades deletion to all related data (profile, food entries, daily logs)
- All tRPC procedures marked as protected require both valid Clerk authentication AND an existing database user record

### Data Model Relationships
- **User**: Central entity linked to Clerk via clerkId. Contains partner linking fields.
- **Profile**: One-to-one relationship with User. Stores physical metrics (age, weight, height, gender, activity level) and calculated values (BMR, TDEE, calorie goal).
- **FoodEntry**: Many-to-one with both User and DailyLog. Represents individual food items logged with full nutritional data.
- **DailyLog**: Many-to-one with User. Aggregated daily totals with a unique constraint on userId + date combination.

### Partner System Logic
- Users can generate a 6-character alphanumeric partner link code
- Generated codes expire after 24 hours
- When User B enters User A's code, bidirectional linking occurs (both users reference each other via partnerId)
- The link code and expiry are cleared from User A after successful linking
- Unlinking removes partner references from both users
- Partners can view each other's daily and weekly summaries but cannot modify each other's data

### BMR/TDEE Calculation Logic
- BMR is calculated using the Mifflin-St Jeor equation, factoring in weight (kg), height (cm), age, and gender
- TDEE is derived by multiplying BMR by an activity level multiplier (ranging from sedentary to very active)
- Users can accept the calculated TDEE as their calorie goal or set a custom goal
- Macro nutrient targets (protein, carbs, fat) are calculated as percentage splits of the calorie goal

### Food Logging Logic
- Food entries originate from two sources: Open Food Facts database search or manual entry
- When a food entry is logged, the system either creates a new DailyLog for that date or finds the existing one
- DailyLog totals (calories, protein, carbs, fat, fiber) are atomically incremented when entries are created
- When updating an entry, the system calculates the nutritional difference and adjusts the DailyLog accordingly
- Deleting an entry decrements the DailyLog totals by the entry's values

### API Router Structure
- **auth router**: Partner code generation, partner linking/unlinking, current user retrieval with profile and partner info
- **profile router**: Profile creation and updates, BMR/TDEE preview calculations, calorie goal updates
- **food router**: Open Food Facts search and barcode lookup, food entry CRUD operations
- **stats router**: Daily summary with meal breakdown, weekly summary with averages, partner daily/weekly summaries

### Frontend Architecture
- Route groups separate authentication pages from protected dashboard pages
- Mobile-first layout with a fixed bottom navigation bar
- Five main navigation sections: Dashboard (home), Search, Log (add food), Partner, Profile
- Data fetching uses tRPC query hooks with React Query for caching (5-second stale time)
- Form state is managed with useState hooks and submitted via tRPC mutations
- Mutations invalidate related queries on success to maintain data consistency
- Toast notifications provide user feedback for actions

### Data Flow Patterns
- Server components can fetch data directly via tRPC server caller for initial page loads
- Client components use tRPC query hooks that leverage React Query's caching layer
- Search functionality uses debounced queries (300ms delay) to minimize API calls
- Query invalidation after mutations ensures UI stays synchronized with server state

### External Integrations
- **Clerk**: Handles all authentication, provides user management UI, sends webhook events for user lifecycle
- **Open Food Facts**: Provides food product search by name and barcode lookup; responses are cached (1 hour for search, 24 hours for barcode)
- **MongoDB**: Document database accessed through Prisma ORM with typed queries and relations
