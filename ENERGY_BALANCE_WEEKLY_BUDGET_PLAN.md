# Implementation Plan: Energy Balance Display + Weekly Budget

> **Source**: MEAL_DIARY_BRAINSTORM.md - Problem 1 (Calorie Policing Mindset)
> **Date**: January 6, 2026
> **Scope**: eato-web + eato-mobile

## Summary

Implement two features to reduce calorie counting anxiety:
- **Idea A**: Qualitative "Energy Balance" display (Light/Balanced/Full) instead of exact calories
- **Idea B**: Weekly budget (14,000 kcal/week) to allow daily compensation

---

## User Requirements (Confirmed)

| Decision | Choice |
|----------|--------|
| Default mode | Qualitative view (tap to toggle to exact) |
| Exact numbers scope | Both daily AND weekly |
| Week reset day | Sunday (Sun-Sat cycle) |
| Balance scope | Show both daily + weekly status |
| Tap behavior | Toggle mode (sticky until tapped again) |
| Thresholds | Strict ±10%: Light <90%, Balanced 90-100%, Full >100% |
| Migration | Auto-calculate weekly = daily × 7 |
| Partner view | Same qualitative display with tap-to-toggle |
| Weekly card | Include (shows suggested daily budget) |

---

## Phase 1: Schema & Backend

### 1.1 Prisma Schema Changes
**File**: `prisma/schema.prisma`

Add to Profile model:
```prisma
// Weekly budget (nullable for migration - auto-calculates if null)
weeklyCalorieBudget  Float?
weekStartDay         Int      @default(0)  // 0=Sunday, 1=Monday...

// Display preference
displayMode          DisplayMode @default(QUALITATIVE)
```

Add enum:
```prisma
enum DisplayMode {
  QUALITATIVE
  EXACT
}
```

### 1.2 New Utility: Energy Balance
**New file**: `src/lib/energy-balance.ts`

```typescript
export type EnergyBalanceLevel = "LIGHT" | "BALANCED" | "FULL";

export function getEnergyBalance(consumed: number, goal: number): EnergyBalanceLevel {
  const ratio = consumed / goal;
  if (ratio < 0.90) return "LIGHT";
  if (ratio <= 1.00) return "BALANCED";
  return "FULL";
}

export const BALANCE_LABELS = {
  LIGHT: "Light",
  BALANCED: "Balanced",
  FULL: "Full"
};

export const BALANCE_COLORS = {
  LIGHT: "var(--success)",      // Green
  BALANCED: "var(--chart-3)",   // Amber
  FULL: "var(--destructive)"    // Red
};
```

### 1.3 New Utility: Weekly Budget
**New file**: `src/lib/weekly-budget.ts`

```typescript
import { startOfWeek, endOfWeek } from "date-fns";

export function getWeekBounds(date: Date, weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0) {
  return {
    start: startOfWeek(date, { weekStartsOn: weekStartDay }),
    end: endOfWeek(date, { weekStartsOn: weekStartDay })
  };
}
```

### 1.4 Stats Router: Add Weekly Budget Status
**File**: `src/server/routers/stats.ts`

New procedure `getWeeklyBudgetStatus`:
- Input: optional date
- Query all DailyLogs for the current week (Sun-Sat)
- Return: `{ weeklyBudget, weeklyConsumed, weeklyRemaining, weeklyBalance, dailyConsumed, dailyGoal, dailyBalance }`

### 1.5 Profile Router: Display Mode
**File**: `src/server/routers/profile.ts`

Add procedure `updateDisplayMode`:
- Input: `{ displayMode: "QUALITATIVE" | "EXACT" }`
- Persist toggle preference

---

## Phase 2: Display Mode Context

### 2.1 New Context Provider
**New file**: `src/contexts/display-mode-context.tsx`

```typescript
interface DisplayModeContextValue {
  displayMode: "QUALITATIVE" | "EXACT";
  toggleDisplayMode: () => void;
  isQualitative: boolean;
}
```

- Read initial state from profile
- Persist changes via tRPC mutation (debounced)
- Fallback to localStorage for unauthenticated state

---

## Phase 3: UI Components

### 3.1 New: EnergyBalanceDisplay Component
**New file**: `src/components/ui/energy-balance-display.tsx`

A toggleable display component:
- **Qualitative mode**: Shows "Light" / "Balanced" / "Full" with subtitle "On track this week" or "Over budget"
- **Exact mode**: Shows "1,847 of 2,000 kcal" + "Weekly: 8,500 / 14,000 kcal"
- Tap triggers `toggleDisplayMode()`
- Animate between modes with Framer Motion

### 3.2 Modify: ProgressRing
**File**: `src/components/dashboard/progress-ring.tsx`

Changes:
1. Add props: `weeklyConsumed?: number`, `weeklyBudget?: number`
2. Replace `CenterContent` with `EnergyBalanceDisplay`
3. Ring color based on `getEnergyBalance()` level (not percentage thresholds)

### 3.3 Modify: DualProgressRing
**File**: `src/components/dashboard/dual-progress-ring.tsx`

Same pattern:
1. Add weekly props for both user and partner
2. Use `EnergyBalanceDisplay` in center
3. Color rings by energy balance level

### 3.4 Modify: PartnerCard
**File**: `src/components/dashboard/partner-card.tsx`

1. Show partner's qualitative balance by default
2. Tap-to-toggle to exact numbers
3. Show combined status: "Light today, On track this week"

### 3.5 New: WeeklyBudgetCard
**New file**: `src/components/dashboard/weekly-budget-card.tsx`

Card below progress ring:
- Weekly progress bar
- "3 days left in week" indicator
- "Suggested: 1,800/day to stay on budget"

---

## Phase 4: Dashboard Integration

### 4.1 Dashboard Page
**File**: `src/app/(dashboard)/dashboard/page.tsx`

1. Wrap content with `<DisplayModeProvider>`
2. Fetch `getWeeklyBudgetStatus` alongside existing queries
3. Pass weekly data to `ProgressRing` / `DualProgressRing`
4. Add `WeeklyBudgetCard` component

---

## Phase 5: Profile Settings

### 5.1 Add Weekly Budget Settings
**File**: `src/app/(dashboard)/profile/page.tsx` or new section

New settings section:
- Custom weekly budget input (default: auto-calculated)
- Week start day selector (Sunday default)
- Display mode toggle (Qualitative/Exact)

---

## Files to Modify (eato-web)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add Profile fields + DisplayMode enum |
| `src/server/routers/stats.ts` | Add `getWeeklyBudgetStatus` procedure |
| `src/server/routers/profile.ts` | Add `updateDisplayMode`, `updateWeeklyBudget` |
| `src/components/dashboard/progress-ring.tsx` | Use EnergyBalanceDisplay in center |
| `src/components/dashboard/dual-progress-ring.tsx` | Same as above |
| `src/components/dashboard/partner-card.tsx` | Qualitative display + toggle |
| `src/app/(dashboard)/dashboard/page.tsx` | Fetch weekly data, add provider |

## New Files to Create (eato-web)

| File | Purpose |
|------|---------|
| `src/lib/energy-balance.ts` | Balance level calculation utilities |
| `src/lib/weekly-budget.ts` | Week boundary calculation |
| `src/contexts/display-mode-context.tsx` | Toggle state management |
| `src/components/ui/energy-balance-display.tsx` | Core toggleable display component |
| `src/components/dashboard/weekly-budget-card.tsx` | Weekly progress card |

---

## Eato Mobile Updates

**Location**: `/Users/kyseah/Documents/GitHub/eato-mobile`

### Mobile Tech Stack
- **Expo SDK 54** with React Native 0.81.5
- **Skia** for animated rings (not SVG)
- **Tamagui** for UI components
- **Same tRPC backend** - schema changes apply automatically

### Files to Modify (eato-mobile)

| File | Change |
|------|--------|
| `components/ui/ProgressRing.tsx` | Add qualitative display mode to CalorieRing |
| `components/ui/DualProgressRing.tsx` | Same for DualCalorieRing |
| `components/dashboard/PartnerCard.tsx` | Qualitative display + tap toggle |
| `app/(tabs)/index.tsx` | Fetch weekly data, add DisplayModeProvider |
| `hooks/useDashboardData.ts` | Add `getWeeklyBudgetStatus` query |
| `types/eato-web.ts` | Add WeeklyBudgetStatus types |

### New Files to Create (eato-mobile)

| File | Purpose |
|------|---------|
| `lib/energy-balance.ts` | Same as web (shared logic) |
| `lib/weekly-budget.ts` | Same as web (shared logic) |
| `contexts/display-mode-context.tsx` | Toggle state for mobile |
| `components/ui/EnergyBalanceDisplay.tsx` | Mobile version with Tamagui |
| `components/dashboard/WeeklyBudgetCard.tsx` | Mobile weekly card |

### Mobile-Specific Considerations

1. **Skia Ring Modifications**:
   - CalorieRing center text needs qualitative labels
   - Tap gesture handler for toggle (using Pressable or Gesture Handler)
   - Haptic feedback on toggle (`expo-haptics`)

2. **Type Sync**:
   - Update `types/eato-web.ts` with new response types
   - Add `DisplayMode`, `EnergyBalanceLevel`, `WeeklyBudgetStatus`

3. **Animation**:
   - Use `react-native-reanimated` for label transitions
   - Shared element transition between qualitative ↔ exact modes

---

## Implementation Order

### Backend (eato-web - shared by both apps)
1. **Schema migration** - Add Profile fields, run `npx prisma db push`
2. **Utility libraries** - `energy-balance.ts`, `weekly-budget.ts`
3. **Backend procedures** - `getWeeklyBudgetStatus`, `updateDisplayMode`

### Web App (eato-web)
4. **Display context** - `DisplayModeProvider`
5. **UI component** - `EnergyBalanceDisplay`
6. **Integration** - Modify ProgressRing, DualProgressRing, PartnerCard
7. **Dashboard** - Wire up weekly data, add provider
8. **WeeklyBudgetCard** - Add below progress ring
9. **Settings** - Profile page weekly budget section

### Mobile App (eato-mobile)
10. **Types** - Update `types/eato-web.ts` with new types
11. **Utility libraries** - Copy `energy-balance.ts`, `weekly-budget.ts`
12. **Display context** - `DisplayModeProvider` for mobile
13. **EnergyBalanceDisplay** - Tamagui version with haptic feedback
14. **Integration** - Modify CalorieRing, DualCalorieRing, PartnerCard
15. **Dashboard** - Wire up weekly data, add provider
16. **WeeklyBudgetCard** - Mobile version with Tamagui

### Polish (both apps)
17. **Animations** - Smooth transitions between modes
18. **Accessibility** - ARIA labels, screen reader support
19. **Edge cases** - Zero data, mid-week changes, new users

---

## Scope Summary

| Area | Files to Modify | Files to Create |
|------|-----------------|-----------------|
| **Backend** (shared) | 3 | 2 |
| **eato-web** | 4 | 3 |
| **eato-mobile** | 6 | 5 |
| **Total** | 13 | 10 |

---

## References

- [MEAL_DIARY_BRAINSTORM.md](./MEAL_DIARY_BRAINSTORM.md) - Original research and ideas
- [MEAL_DIARY_REVAMP.md](./MEAL_DIARY_REVAMP.md) - Related revamp plan
