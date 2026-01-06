# Eato React Native + Expo Migration Plan

> **Created**: January 2026
> **Status**: Planning Complete - Ready for Implementation

## Project Overview

Convert the Eato Next.js PWA (calorie tracking for couples) into a React Native + Expo mobile app, with the long-term goal of creating a universal Tamagui app that powers both web and mobile from shared code.

---

## Confirmed Stack Choices

| Category | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Expo (managed workflow) | Simplified native development |
| **Navigation** | Expo Router | File-based routing, familiar from Next.js |
| **Styling** | Tamagui | Universal components, eventual web rewrite |
| **Platforms** | iOS + Android | Full cross-platform from start |
| **Animations** | React Native Reanimated 3 | Industry standard, 60fps |
| **Charts** | React Native Skia | GPU-accelerated, custom progress rings |
| **Auth** | Clerk React Native | Continuity with existing Clerk setup |
| **Data** | tRPC + React Query | Same as web, unchanged |
| **Bottom Sheets** | @gorhom/bottom-sheet | De facto standard |
| **Forms** | React Hook Form | Same as web |
| **Push** | Expo Notifications | Unified API for iOS/Android |
| **Barcode** | expo-camera | Native barcode scanning |

**Long-term Vision**: Eventually rewrite the Next.js web app using Tamagui, creating a true universal codebase where components are shared between web and mobile.

---

## Architecture

### Repository Strategy: Separate Repo (Phase 1) → Universal App (Phase 2)

**Phase 1: Separate Mobile Repo**
```
eato-mobile/                    # New Expo repo
├── app/                        # Expo Router pages
│   ├── (auth)/                 # Login, Register
│   ├── (tabs)/                 # Main tab navigation
│   │   ├── index.tsx           # Dashboard
│   │   ├── search.tsx          # Food search
│   │   ├── log.tsx             # Add food
│   │   ├── partner.tsx         # Partner view
│   │   └── profile.tsx         # Settings
│   └── _layout.tsx             # Root layout
├── components/                 # Tamagui components
│   ├── ui/                     # Base components (Button, Input, Card)
│   ├── food/                   # Food-related components
│   ├── dashboard/              # Dashboard widgets
│   └── partner/                # Partner features
├── lib/                        # Copied utilities from web
│   ├── bmr.ts
│   ├── energy.ts
│   ├── recipe-calculator.ts
│   ├── meal-parser.ts
│   └── gamification/
├── hooks/                      # React hooks
├── types/                      # TypeScript types
└── tamagui.config.ts           # Tamagui theme (matching web colors)
```

**Phase 2: Universal App (Future)**
- Migrate Next.js web to use Tamagui
- Extract shared components to a package
- Single codebase for web + mobile

### Backend Strategy
- **Keep existing Next.js backend** at `eato-web`
- Mobile app calls same `/api/trpc` endpoints
- Same Clerk project (shared auth)
- Same MongoDB database

---

## Code Reuse Strategy

### Files to Copy from eato-web to eato-mobile

| Source (eato-web) | Destination (eato-mobile) | Notes |
|-------------------|---------------------------|-------|
| `src/lib/bmr.ts` | `lib/bmr.ts` | 100% reusable |
| `src/lib/energy.ts` | `lib/energy.ts` | 100% reusable |
| `src/lib/recipe-calculator.ts` | `lib/recipe-calculator.ts` | 100% reusable |
| `src/lib/meal-parser.ts` | `lib/meal-parser.ts` | 100% reusable |
| `src/lib/gamification/badges.ts` | `lib/gamification/badges.ts` | 100% reusable |
| `src/lib/gamification/streaks.ts` | `lib/gamification/streaks.ts` | 100% reusable |
| `src/types/food.ts` | `types/food.ts` | 100% reusable |
| `src/types/meal-estimation.ts` | `types/meal-estimation.ts` | 100% reusable |

**Backend stays unchanged** - Mobile connects to the same Next.js API at `/api/trpc`.

### Component Mapping (Web → Mobile)

| Web (shadcn/Tailwind) | Mobile (Tamagui) | Notes |
|-----------------------|------------------|-------|
| Button | Tamagui Button | Direct mapping |
| Input | Tamagui Input | Direct mapping |
| Card | Tamagui Card | Direct mapping |
| Sheet (bottom drawer) | @gorhom/bottom-sheet | Different API |
| Dialog | Tamagui Dialog or Sheet | Modal or bottom sheet |
| Tabs | Tamagui Tabs | Direct mapping |
| Select | Tamagui Select | Native picker on mobile |
| Progress (bar) | Tamagui Progress | Direct mapping |
| Avatar | Tamagui Avatar | Direct mapping |
| Switch | Tamagui Switch | Direct mapping |
| Progress Ring (SVG) | React Native Skia | Custom Skia component |
| Sparkline (Recharts) | React Native Skia | Custom Skia chart |
| Framer Motion | Reanimated 3 | Different API, same concepts |
| Sonner toasts | Burnt or custom | RN toast library |

---

## Implementation Phases

### Phase 1: Project Foundation (Week 1)
**Goal**: Bootable app with navigation and auth

```bash
# Initial setup commands
npx create-expo-app eato-mobile -t tabs
cd eato-mobile
npx expo install @tamagui/core @tamagui/config react-native-reanimated
npx expo install @clerk/clerk-expo expo-secure-store
npx expo install @tanstack/react-query @trpc/client @trpc/react-query
```

**Tasks:**
- [ ] Initialize Expo project with TypeScript
- [ ] Install & configure Tamagui (theme matching web colors)
- [ ] Set up Expo Router with tab navigation
- [ ] Configure tRPC client to connect to existing backend
- [ ] Set up Clerk React Native authentication
- [ ] Build login/register screens
- [ ] Implement protected route wrapper
- [ ] Copy utility files from web (bmr.ts, energy.ts, etc.)
- [ ] Copy type definitions from web

**Critical Files to Copy:**
- `src/lib/bmr.ts` → `lib/bmr.ts`
- `src/lib/energy.ts` → `lib/energy.ts`
- `src/lib/recipe-calculator.ts` → `lib/recipe-calculator.ts`
- `src/lib/meal-parser.ts` → `lib/meal-parser.ts`
- `src/lib/gamification/` → `lib/gamification/`
- `src/types/` → `types/`

### Phase 2: Design System & Base Components (Week 1-2)
**Goal**: Tamagui component library matching web design

**Tasks:**
- [ ] Create Tamagui theme config (OKLCH colors from web)
- [ ] Build base components:
  - [ ] Button (variants: primary, secondary, outline, ghost)
  - [ ] Input with label
  - [ ] Card component
  - [ ] Badge component
  - [ ] Avatar component
  - [ ] Skeleton loader
- [ ] Set up @gorhom/bottom-sheet for modals
- [ ] Install React Native Skia
- [ ] Build ProgressRing component with Skia
- [ ] Build DualProgressRing for partner mode

### Phase 3: Dashboard (Week 2-3)
**Goal**: Functional main dashboard

**Components to Build:**
- [ ] DashboardHeader (date navigation, streak counter)
- [ ] ProgressRing (Skia-based circular progress)
- [ ] DualProgressRing (partner comparison view)
- [ ] MacroCard (protein/carbs/fat summary)
- [ ] WeeklySparkline (Skia mini chart)
- [ ] MealSection (collapsible meal groups)
- [ ] FoodEntryRow (individual food item)
- [ ] PartnerCard (partner summary widget)

**Features:**
- [ ] Date swipe navigation (Gesture Handler + Reanimated)
- [ ] Pull-to-refresh
- [ ] tRPC queries: getDailySummary, getWeeklySummary, getStreakData
- [ ] Meal type grouping (Breakfast, Lunch, Dinner, Snack)

### Phase 4: Food Search & Logging (Week 3-4)
**Goal**: Complete food logging flow

**Components to Build:**
- [ ] FoodSearch (debounced input, results list)
- [ ] FoodSearchResult (product card with nutrition)
- [ ] BarcodeScanner (expo-camera integration)
- [ ] FoodEntryForm (serving size, meal type selection)
- [ ] QuickAccessTabs (Recent, Frequent, Favorites)
- [ ] ManualEntryForm (custom food entry)
- [ ] QuickEnergyForm (quick calorie entry)

**Features:**
- [ ] 300ms debounced search
- [ ] Barcode scanning with camera
- [ ] Add to favorites
- [ ] Log for partner (approval workflow)
- [ ] tRPC mutations: search, log, toggleFavorite

### Phase 5: Partner Features (Week 4-5)
**Goal**: Full partner collaboration

**Components to Build:**
- [ ] PartnerLinkingScreen (generate/enter code)
- [ ] PartnerDaySheet (partner's daily detail)
- [ ] PartnerMealSection (partner's meals)
- [ ] ActivityFeed (partner's recent activity)
- [ ] ApprovalsList (pending food approvals)
- [ ] MySubmissionsList (entries waiting approval)
- [ ] NudgeButton (send partner reminder)

**Features:**
- [ ] Partner code generation (24hr expiry)
- [ ] Bidirectional linking
- [ ] Approve/reject food entries
- [ ] Copy partner's meal
- [ ] Activity feed with pagination

### Phase 6: Recipes & Meal Calculator (Week 5-6)
**Goal**: Recipe management and meal estimation

**Components to Build:**
- [ ] RecipeList (user's + partner's recipes)
- [ ] RecipeCard (recipe preview)
- [ ] RecipeForm (create/edit with ingredients)
- [ ] IngredientSearch (search & add)
- [ ] IngredientRow (editable ingredient)
- [ ] NutritionPreview (real-time calculation)
- [ ] MealCalculator (free-form ingredient input)
- [ ] MealEstimationHistory (past estimations)

**Features:**
- [ ] Baker's percentage support
- [ ] Batch ingredient search
- [ ] Log recipe as food entry
- [ ] Meal text parsing

### Phase 7: Profile & Onboarding (Week 6)
**Goal**: Complete user profile management

**Components to Build:**
- [ ] ProfileScreen (user info, settings)
- [ ] OnboardingWizard (multi-step setup)
- [ ] MetricsForm (age, weight, height, gender)
- [ ] ActivityLevelPicker
- [ ] GoalSetup (calorie goal)
- [ ] EnergyUnitToggle (kcal/kJ)
- [ ] NotificationSettings

**Features:**
- [ ] BMR/TDEE calculator preview
- [ ] Custom calorie goal
- [ ] Push notification opt-in

### Phase 8: Gamification (Week 6-7)
**Goal**: Streaks, badges, celebrations

**Components to Build:**
- [ ] StreakCounter (flame animation)
- [ ] StreakCelebration (milestone animation)
- [ ] BadgeShowcase (achievement grid)
- [ ] BadgeDetailSheet
- [ ] DuoFlame (partner streak display)
- [ ] JointCelebration (shared achievement)
- [ ] AvatarFrame (badge-based frames)

**Features:**
- [ ] Streak animations with Reanimated
- [ ] Badge unlock notifications
- [ ] Theme unlocking at milestones

### Phase 9: Push Notifications (Week 7)
**Goal**: Native push notifications

**Setup:**
- [ ] Configure Expo Notifications
- [ ] Set up EAS for push tokens
- [ ] Update backend to handle Expo push tokens (vs web push)
- [ ] Implement notification categories:
  - [ ] Partner food logged
  - [ ] Partner goal reached
  - [ ] Pending approval
  - [ ] Nudge received
  - [ ] Meal reminders

### Phase 10: Polish & Launch (Week 8+)
**Goal**: App store ready

**Tasks:**
- [ ] Animation polish (micro-interactions)
- [ ] Haptic feedback (expo-haptics)
- [ ] Offline support (React Query persistence)
- [ ] Error boundaries
- [ ] App icon & splash screen
- [ ] App Store screenshots
- [ ] TestFlight beta
- [ ] Play Store internal testing
- [ ] Production release

---

## Key Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "@tamagui/core": "^1.x",
    "@tamagui/config": "^1.x",
    "@clerk/clerk-expo": "^2.x",
    "@tanstack/react-query": "^5.x",
    "@trpc/client": "^11.x",
    "@trpc/react-query": "^11.x",
    "react-native-reanimated": "~3.x",
    "react-native-gesture-handler": "~2.x",
    "@gorhom/bottom-sheet": "^4.x",
    "@shopify/react-native-skia": "^1.x",
    "expo-camera": "~16.x",
    "expo-notifications": "~0.x",
    "expo-haptics": "~14.x",
    "expo-secure-store": "~14.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "superjson": "^2.x",
    "date-fns": "^3.x"
  }
}
```

---

## Environment Variables (Mobile)

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_API_URL=https://eato-web.vercel.app  # or your backend URL
```

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Foundation | Week 1 | Bootable app with auth |
| 2. Design System | Week 1-2 | Tamagui components, Skia rings |
| 3. Dashboard | Week 2-3 | Main dashboard with data |
| 4. Food Logging | Week 3-4 | Search, barcode, logging |
| 5. Partner | Week 4-5 | Partner features |
| 6. Recipes | Week 5-6 | Recipe management |
| 7. Profile | Week 6 | Onboarding, settings |
| 8. Gamification | Week 6-7 | Streaks, badges |
| 9. Notifications | Week 7 | Push notifications |
| 10. Launch | Week 8+ | App store submission |

**Total: ~8-9 weeks to MVP**

---

## Next Steps

1. Create new `eato-mobile` repository
2. Initialize Expo project with TypeScript template
3. Set up Tamagui with custom theme
4. Configure tRPC client
5. Begin Phase 1 implementation

---

## Reference: Web Codebase Analysis

### tRPC Routers (8 total)
- `auth` - Partner code generation, linking/unlinking, getMe
- `profile` - Profile CRUD, BMR/TDEE calculations
- `food` - Search (FatSecret), logging, favorites, approvals
- `stats` - Daily/weekly summaries, streak data, partner stats
- `recipe` - Recipe CRUD, ingredient management, nutrition calculation
- `mealEstimation` - Free-form meal calculator
- `achievements` - Badges, unlocking, partner achievements
- `notification` - Push subscription management

### Key Business Logic Files
- `src/lib/bmr.ts` - Mifflin-St Jeor equation, TDEE, macro calculation
- `src/lib/energy.ts` - kcal/kJ conversion
- `src/lib/recipe-calculator.ts` - Recipe nutrition math, baker's percentages
- `src/lib/meal-parser.ts` - Free-form text parsing ("200g flour")
- `src/lib/gamification/badges.ts` - 30+ badge definitions
- `src/lib/gamification/streaks.ts` - Streak calculation, freezes, milestones

### UI Components (82 total)
Organized in: `ui/`, `dashboard/`, `food/`, `partner/`, `recipe/`, `gamification/`, `onboarding/`, `layout/`
