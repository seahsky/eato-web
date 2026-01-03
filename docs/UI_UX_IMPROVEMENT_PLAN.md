# Eato UI/UX Comprehensive Improvement Plan

> **Document Version**: 1.0
> **Date**: January 3, 2026
> **Scope**: Complete UI/UX audit and improvement roadmap for Eato PWA

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Design System Review](#design-system-review)
4. [Identified UX Friction Points](#identified-ux-friction-points)
5. [Improvement Categories](#improvement-categories)
   - [Quick Wins](#phase-1-quick-wins)
   - [Medium Effort](#phase-2-medium-effort)
   - [Major Features](#phase-3-major-features)
6. [Visual Hierarchy Improvements](#visual-hierarchy-improvements)
7. [Micro-Interaction Opportunities](#micro-interaction-opportunities)
8. [Accessibility Improvements](#accessibility-improvements)
9. [Mobile-Specific Optimizations](#mobile-specific-optimizations)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Success Metrics](#success-metrics)
12. [File Reference](#file-reference)

---

## Executive Summary

### Overall UX Rating: **7.2/10**
*Strong foundation with room for polish*

### Key Strengths
| Strength | Description |
|----------|-------------|
| **Warm Color Palette** | Terracotta + sage green combination is memorable and emotionally resonant for a couples' health app |
| **Partner-First Design** | Dual progress rings, joint celebrations, and partner theming create genuine differentiation |
| **Animation Quality** | Extensive Framer Motion usage with purposeful animations (heartbeat-sync, duo-flame-dance) |
| **Mobile-First Execution** | Proper safe-area handling, bottom nav with floating action, touch-optimized targets |

### Key Weaknesses
| Weakness | Impact |
|----------|--------|
| **Onboarding Cliff** | Empty dashboard before profile setup creates cold first impression |
| **Buried Quick Actions** | Barcode scanner and recipes require navigation hunting |
| **Passive Empty States** | No emotional design or CTAs when meals are empty |
| **Visual Hierarchy Competition** | Macro cards compete for attention equally; no clear focal point after progress ring |

### Target State: **8.5+/10**

---

## Current State Analysis

### Component Architecture

**Total Components**: 73 files across 13 directories

```
src/components/
├── ui/                    (23 files - shadcn/ui base + custom)
├── dashboard/             (5 components - progress, macros, meals)
├── food/                  (8 components - search, logging, forms)
├── partner/               (8 components - collaboration features)
├── gamification/          (6 components - streaks, badges, celebrations)
├── recipe/                (8 components - recipe management)
├── meal-estimation/       (4 components - AI estimation)
├── barcode/               (5 components - scanning)
├── notifications/         (3 components - push notifications)
├── layout/                (2 components - navigation)
└── providers/             (1 wrapper - context provider)
```

### Navigation Structure

```
Bottom Navigation (5 tabs):
├── Home (/dashboard)      - Daily view with progress ring
├── Search (/search)       - Food database search
├── Add (/log)             - Floating FAB, 3 tabs: Search/Recipes/Meal Calc
├── Partner (/partner)     - Partner linking and stats
└── Profile (/profile)     - Settings and achievements
```

### Key User Flows

#### Flow 1: Onboarding
```
Landing (/) → Register → Dashboard (empty) → Profile Setup → Dashboard (active)
```
**Issue**: Users see empty progress ring before completing profile setup.

#### Flow 2: Food Logging
```
Dashboard → "+" Button → /log → Search/Select → Entry Form → Submit → Dashboard
```
**Issue**: Multiple taps required for common actions (barcode, recipes).

#### Flow 3: Partner Collaboration
```
/partner → Generate Code → Share → Partner Enters Code → Bidirectional Link
```
**Issue**: Food approval requires navigation to separate page.

---

## Design System Review

### Color Palette (OKLCH Color Space)

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| **Primary** | `oklch(0.55 0.14 30)` | `oklch(0.68 0.14 30)` | Warm terracotta - main actions |
| **Secondary** | `oklch(0.85 0.05 145)` | `oklch(0.35 0.06 145)` | Sage green - partner theme |
| **Background** | `oklch(0.975 0.008 85)` | `oklch(0.18 0.015 50)` | Warm cream/dark |
| **Accent** | `oklch(0.88 0.08 65)` | `oklch(0.35 0.06 65)` | Soft warm orange |
| **Success** | `oklch(0.6 0.14 145)` | `oklch(0.5 0.12 145)` | Forest green |
| **Destructive** | `oklch(0.6 0.18 25)` | `oklch(0.5 0.15 25)` | Muted coral |

### Partner Theme Colors
```css
--you-color: var(--primary)           /* Terracotta */
--partner-color: oklch(0.65 0.08 145) /* Sage green */
--connection-glow: oklch(0.75 0.12 75) /* Warm gold */
```

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Body | SF Pro Text | 400/500 | 14-16px |
| Headings | SF Pro Display | 600/700 | 18-28px |
| Labels | SF Pro Text | 500 | 10-12px |
| Numbers | SF Pro Text (tabular) | 600 | Variable |

### Animation Library

| Animation | Duration | Usage |
|-----------|----------|-------|
| `heartbeat-sync` | 1.5s loop | Partner sync pulse |
| `connection-pulse` | 2s loop | Connection glow |
| `duo-flame-dance` | 2s loop | Couple flame rotation |
| `orbit-slow` | 60s loop | Badge constellation |
| `confetti-fall` | Custom | Celebration effects |

---

## Identified UX Friction Points

### Critical Friction Points

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **F-1** | Profile setup blocking | Dashboard | High - Users see empty progress ring |
| **F-2** | Partner approval navigation | /partner?tab=approvals | Medium - Two-step verification |
| **F-3** | Barcode scanner depth | Search → Icon → Sheet | High - Common action buried |
| **F-4** | Recipe discoverability | Only in /log tab | Medium - Frequent users affected |
| **F-5** | Date navigation ambiguity | Dashboard header | Medium - Users confused on past dates |
| **F-6** | Passive empty states | Meal sections | Medium - No call-to-action |
| **F-7** | Notification re-prompt | Profile | Low - No way to re-enable |
| **F-8** | Energy unit disconnect | Profile toggle | Low - Form state mismatch |

### Navigation Gaps

| Gap | Description |
|-----|-------------|
| No quick partner stats from dashboard | Must navigate to /partner |
| Recipe creation scattered | /log → Recipes tab OR /recipes/new |
| Goal suggestions buried | Only visible on /profile |
| No personal activity history | Partner history exists but not personal |

---

## Improvement Categories

## Phase 1: Quick Wins
*Implementation: < 2 hours each*

### QW-1: Empty State CTAs in Meal Sections

**What**: Add "Add first [meal]" button when a meal section has no entries.

**Why**: Reduces cognitive load; users don't need to find the "+" icon in header.

**Files**:
- `src/components/dashboard/meal-section.tsx` (lines 95-98)

**Implementation**:
```tsx
// Replace "No items yet" with actionable CTA
{entries.length === 0 ? (
  <Link href={`/log?meal=${mealType.toLowerCase()}`}>
    <Button variant="ghost" size="sm" className="gap-2">
      <Plus className="w-4 h-4" />
      Add first {config.label.toLowerCase()}
    </Button>
  </Link>
) : (
  `${entries.length} item${entries.length > 1 ? "s" : ""}`
)}
```

**Acceptance Criteria**:
- [ ] Each meal section shows CTA when empty
- [ ] CTA links to /log with meal type pre-selected
- [ ] Consistent styling with existing buttons

---

### QW-2: Pending Approvals Badge on Bottom Nav

**What**: Show badge counter on Partner nav icon when approvals are pending.

**Why**: Users don't notice the dashboard banner; badge creates urgency.

**Files**:
- `src/components/layout/bottom-nav.tsx` — Add badge display
- `src/app/(dashboard)/layout.tsx` — Fetch pending count at layout level

**Implementation**:
```tsx
// In bottom-nav.tsx, add badge for Partner item
{item.href === "/partner" && pendingCount > 0 && (
  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-medium">
    {pendingCount > 9 ? "9+" : pendingCount}
  </span>
)}
```

**Acceptance Criteria**:
- [ ] Badge appears on Partner icon when count > 0
- [ ] Badge shows actual count up to 9, then "9+"
- [ ] Badge has subtle animation on count change

---

### QW-3: Enhanced Date Navigation Affordance

**What**: Add colored background tint when viewing past dates + prominent "Return to Today" button.

**Why**: Current "Tap to go to today" text is easily missed.

**Files**:
- `src/app/(dashboard)/dashboard/page.tsx` (lines 145-147)

**Implementation**:
```tsx
// Wrap entire content in conditional background
<div className={cn(
  "p-4 space-y-6 transition-colors duration-300",
  !isToday && "bg-amber-50/30 dark:bg-amber-950/20"
)}>
  {/* Add banner when viewing past date */}
  {!isToday && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button onClick={goToToday} variant="secondary" size="sm" className="w-full gap-2">
        <CalendarDays className="w-4 h-4" />
        Return to Today
      </Button>
    </motion.div>
  )}
```

**Acceptance Criteria**:
- [ ] Background tint applied when viewing non-today dates
- [ ] Prominent "Return to Today" button appears
- [ ] Smooth transition when switching dates

---

### QW-4: Enhanced Profile Setup Banner

**What**: Make "Complete Profile" banner more prominent with icon and clearer value proposition.

**Why**: Users need BMR calculated before tracking is meaningful.

**Files**:
- `src/app/(dashboard)/dashboard/page.tsx` (lines 213-228)

**Implementation**:
```tsx
<motion.div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-dashed border-primary/40 rounded-2xl p-5 text-center">
  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
    <User className="w-6 h-6 text-primary" />
  </div>
  <h3 className="font-semibold mb-1">Calculate Your Calorie Goal</h3>
  <p className="text-sm text-muted-foreground mb-3">
    Set up your profile to get personalized daily targets
  </p>
  <Link href="/profile">
    <Button className="shadow-lg">Complete Profile</Button>
  </Link>
</motion.div>
```

**Acceptance Criteria**:
- [ ] Banner has gradient background and icon
- [ ] Clear value proposition messaging
- [ ] CTA button is prominent

---

### QW-5: Floating Barcode Scanner Button

**What**: Add floating barcode scan button on search page for quick access.

**Why**: Barcode scanning is a high-frequency action currently requiring 2 taps.

**Files**:
- `src/app/(dashboard)/search/page.tsx` — Add floating button
- Reuse `src/components/barcode/barcode-scanner-sheet.tsx`

**Implementation**:
```tsx
// Add at bottom of search page, above bottom nav
const [scannerOpen, setScannerOpen] = useState(false);

<div className="fixed bottom-24 right-4 z-40">
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Button
      size="lg"
      className="rounded-full h-14 w-14 shadow-lg shadow-primary/30"
      onClick={() => setScannerOpen(true)}
    >
      <Scan className="w-6 h-6" />
    </Button>
  </motion.div>
</div>
<BarcodeScannerSheet open={scannerOpen} onOpenChange={setScannerOpen} />
```

**Acceptance Criteria**:
- [ ] Floating button visible on search page
- [ ] Opens barcode scanner sheet on tap
- [ ] Positioned to not overlap with bottom nav

---

## Phase 2: Medium Effort
*Implementation: 2-8 hours each*

### ME-1: Expandable FAB with Multiple Actions

**What**: Replace single "+" button with radial menu offering: Quick Entry, Barcode, Recipe, Meal Estimation.

**Why**: Surfaces all entry methods in one tap; reduces navigation.

**Files**:
- `src/components/layout/bottom-nav.tsx` — Refactor Add button
- New file: `src/components/layout/fab-menu.tsx`

**Implementation**:
```tsx
// FAB Menu Component
const fabItems = [
  { icon: Zap, label: "Quick", href: "/log?tab=quick" },
  { icon: Scan, label: "Scan", action: "barcode" },
  { icon: BookOpen, label: "Recipe", href: "/log?tab=recipes" },
  { icon: Sparkles, label: "Estimate", href: "/log?tab=meal" },
];

// Radial expansion with 45° intervals
<AnimatePresence>
  {isOpen && fabItems.map((item, index) => (
    <motion.button
      key={item.label}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: Math.cos((index * 45 + 180) * Math.PI / 180) * 70,
        y: Math.sin((index * 45 + 180) * Math.PI / 180) * 70,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <item.icon className="w-5 h-5" />
    </motion.button>
  ))}
</AnimatePresence>
```

**Acceptance Criteria**:
- [ ] FAB expands to show 4 options
- [ ] Smooth radial animation
- [ ] Backdrop closes menu on tap outside
- [ ] Each option navigates to correct destination

---

### ME-2: Swipe Gesture for Date Navigation

**What**: Enable horizontal swipe on dashboard to navigate between days.

**Why**: Matches native health app patterns; more intuitive than arrow buttons.

**Files**:
- `src/app/(dashboard)/dashboard/page.tsx`

**Implementation**:
```tsx
// Use framer-motion drag gesture
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100 && info.velocity.x > 0) {
      goToPrevDay();
    }
    if (info.offset.x < -100 && info.velocity.x < 0 && !isToday) {
      goToNextDay();
    }
  }}
  className="touch-pan-y"
>
  {/* Dashboard content */}
</motion.div>
```

**Acceptance Criteria**:
- [ ] Swipe right goes to previous day
- [ ] Swipe left goes to next day (disabled if today)
- [ ] Elastic bounce feedback at boundaries
- [ ] Does not interfere with vertical scrolling

---

### ME-3: Recipe Quick Access Carousel

**What**: Add horizontal scrolling "Your Recipes" section below meals.

**Why**: Recipes only accessible from /log tab; frequent users need quick access.

**Files**:
- New file: `src/components/dashboard/recent-recipes.tsx`
- `src/app/(dashboard)/dashboard/page.tsx` — Add section

**Implementation**:
```tsx
// Horizontal scroll container with recipe mini-cards
export function RecentRecipes() {
  const { data: recipes } = trpc.recipe.getRecent.useQuery({ limit: 5 });

  if (!recipes?.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Quick Recipes
        </h2>
        <Link href="/recipes" className="text-xs text-primary">
          View All
        </Link>
      </div>
      <ScrollArea className="w-full" orientation="horizontal">
        <div className="flex gap-3 pb-2">
          {recipes.map(recipe => (
            <RecipeMiniCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows up to 5 recent recipes
- [ ] Horizontal scroll with touch support
- [ ] Mini cards show name, calories, quick log button
- [ ] Hidden if user has no recipes

---

### ME-4: Weekly Trend Sparkline

**What**: Add 7-day trend sparkline beneath progress ring.

**Why**: Daily view lacks context; users need to see patterns.

**Files**:
- New file: `src/components/dashboard/weekly-sparkline.tsx`
- `src/app/(dashboard)/dashboard/page.tsx` — Add below progress ring

**Implementation**:
```tsx
// SVG sparkline showing 7-day calorie trend
export function WeeklySparkline({ data }: { data: DayData[] }) {
  const maxCal = Math.max(...data.map(d => d.calories));
  const points = data.map((d, i) => {
    const x = (i / 6) * 100;
    const y = 100 - (d.calories / maxCal) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 50" className="w-full h-12">
      <polyline
        points={points}
        fill="none"
        stroke="url(#sparkline-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Goal line */}
      <line x1="0" y1="20" x2="100" y2="20" stroke="var(--muted)" strokeDasharray="2,2" />
    </svg>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows 7-day calorie trend
- [ ] Gradient matches partner colors when linked
- [ ] Goal line reference visible
- [ ] Tappable for daily breakdowns

---

### ME-5: Inline Partner Approval Toasts

**What**: When partner logs food for you, show toast notification with inline approve/reject actions.

**Why**: Eliminates navigation to approvals tab.

**Files**:
- Modify push notification payload
- `src/app/sw.ts` — Handle notification actions
- New hook: `src/hooks/use-approval-toasts.ts`

**Implementation**:
```tsx
// Toast with action buttons
toast.custom((t) => (
  <div className="bg-card border rounded-xl p-4 shadow-lg">
    <div className="flex items-center gap-3 mb-3">
      <Avatar className="w-8 h-8">
        <AvatarFallback>{partnerName[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-sm">{partnerName} logged food for you</p>
        <p className="text-xs text-muted-foreground">{foodName} • {calories} kcal</p>
      </div>
    </div>
    <div className="flex gap-2">
      <Button size="sm" onClick={() => approve(entryId)}>Approve</Button>
      <Button size="sm" variant="outline" onClick={() => reject(entryId)}>Reject</Button>
    </div>
  </div>
));
```

**Acceptance Criteria**:
- [ ] Toast appears when partner logs food
- [ ] Inline approve/reject buttons work
- [ ] Dashboard updates on action
- [ ] Toast auto-dismisses after action

---

### ME-6: Energy Unit Persistent Toggle

**What**: Add floating chip in header showing current unit (kcal/kJ) with quick toggle.

**Why**: Setting in profile feels disconnected from daily usage.

**Files**:
- New file: `src/components/ui/energy-unit-toggle.tsx`
- `src/app/(dashboard)/layout.tsx` — Add to header area

**Implementation**:
```tsx
export function EnergyUnitToggle() {
  const { unit, setUnit } = useEnergy();

  return (
    <button
      onClick={() => setUnit(unit === "KCAL" ? "KJ" : "KCAL")}
      className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs font-medium"
    >
      <motion.span
        key={unit}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {unit}
      </motion.span>
      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
    </button>
  );
}
```

**Acceptance Criteria**:
- [ ] Chip visible in dashboard header
- [ ] Tap toggles between kcal/kJ
- [ ] All energy values update immediately
- [ ] Persists preference

---

## Phase 3: Major Features
*Implementation: 1-2 weeks each*

### MF-1: Onboarding Wizard

**What**: 3-step guided setup: Body metrics → Activity level → Goal selection.

**Why**: Transforms cold start into engaging ritual; ensures profile completion.

**Files**:
- New file: `src/components/onboarding/onboarding-wizard.tsx`
- New file: `src/components/onboarding/step-metrics.tsx`
- New file: `src/components/onboarding/step-activity.tsx`
- New file: `src/components/onboarding/step-goal.tsx`
- `src/app/(dashboard)/dashboard/page.tsx` — Show wizard for new users

**User Flow**:
```
Step 1: Body Metrics
├── Illustrated silhouette animation
├── Age, Weight, Height inputs
└── Gender selection with icons

Step 2: Activity Level
├── 5 animated icons (sedentary → very active)
├── Description of each level
└── Visual indicator of selected level

Step 3: Goal Selection
├── Calculated BMR/TDEE display
├── 6 goal suggestions with explanations
├── Custom goal option
└── Partner invite prompt (optional)
```

**Acceptance Criteria**:
- [ ] Wizard shows for users without completed profile
- [ ] Progress indicator visible
- [ ] Back/Next navigation works
- [ ] Skippable with "Set up later" option
- [ ] Celebration animation on completion

---

### MF-2: Partner Activity Feed
*(Renumbered after AI Photo Recognition removal)*

**What**: Real-time feed showing partner's logs, achievements, milestones.

**Why**: Static partner view lacks emotional connection; feed creates motivation.

**Files**:
- New file: `src/components/partner/partner-feed.tsx`
- New file: `src/components/partner/feed-item.tsx`
- New tRPC endpoint: `stats.getPartnerActivity`
- `src/app/(dashboard)/partner/page.tsx` — Replace/enhance history tab

**Feed Item Types**:
- Food logged (with quick copy action)
- Daily goal hit (celebration)
- Streak milestone reached
- Badge earned
- Recipe created

**Implementation**:
```tsx
// Feed with real-time polling
const { data: feed } = trpc.stats.getPartnerActivity.useQuery(
  undefined,
  { refetchInterval: 30000 } // 30s polling
);

return (
  <div className="space-y-4">
    {feed?.map((item) => (
      <FeedItem key={item.id} item={item} />
    ))}
  </div>
);
```

**Acceptance Criteria**:
- [ ] Shows partner's recent activity
- [ ] Real-time updates (30s polling or WebSocket)
- [ ] Interactive items (copy food, send celebration)
- [ ] Empty state with prompt to invite partner

---

## Visual Hierarchy Improvements

### Current Problem
Macro cards (protein/carbs/fat) have equal visual weight and compete for attention after the progress ring.

### Solution

**Before**:
```
[Protein] [Carbs] [Fat]
   ↑        ↑       ↑
     Equal weight
```

**After**:
```
[       PROTEIN       ] ← Larger, primary focus
[  Carbs  ] [   Fat   ] ← Smaller, secondary
```

**Implementation**:
```tsx
// src/app/(dashboard)/dashboard/page.tsx
<MacroCard
  label="Protein"
  current={summary?.totalProtein ?? 0}
  goal={macroTargets.protein}
  color="var(--chart-1)"
  variant="primary"  // New prop
  className="col-span-3"
/>
<div className="grid grid-cols-2 gap-3">
  <MacroCard
    label="Carbs"
    current={summary?.totalCarbs ?? 0}
    goal={macroTargets.carbs}
    color="var(--chart-3)"
    variant="secondary"
  />
  <MacroCard
    label="Fat"
    current={summary?.totalFat ?? 0}
    goal={macroTargets.fat}
    color="var(--chart-4)"
    variant="secondary"
  />
</div>
```

---

## Micro-Interaction Opportunities

### Progress Ring Interactions

| Trigger | Animation |
|---------|-----------|
| Goal hit | Ring fills with particle burst |
| Over goal | Ring pulses red gently, number shakes |
| Partner sync | Rings briefly connect with light beam |

### Macro Cards Interactions

| Trigger | Animation |
|---------|-----------|
| Progress fill | Spring physics with bounce at end |
| 100% achieved | Card glows momentarily |
| Tap to expand | Show breakdown of contributing foods |

### Meal Section Interactions

| Trigger | Animation |
|---------|-----------|
| Add entry | Card slides in from right with bounce |
| Delete entry | Card shrinks and fades with "pop" |
| Reorder | Drag handle with haptic feedback |

### Navigation Interactions

| Trigger | Animation |
|---------|-----------|
| Tab switch | Content crossfade with slight Y offset |
| Add button press | Scale down with ripple effect |
| Pending badge | Subtle bounce loop |

### Partner Interactions

| Trigger | Animation |
|---------|-----------|
| Link success | Hearts floating up |
| Nudge sent | Paper airplane flying off-screen |
| Approval | Checkmark morphs with celebration particles |

---

## Accessibility Improvements

### Color Contrast Fixes

| Issue | Current | Fix |
|-------|---------|-----|
| Sage text on cream | `oklch(0.85 0.05 145)` | Darken to `oklch(0.45 0.08 145)` |
| Muted text contrast | May fail WCAG AA | Audit all instances |

### Touch Target Requirements

| Element | Current | Required |
|---------|---------|----------|
| Meal dropdown icons | ~32px | 48x48px minimum |
| Edit buttons | 32px | 44px minimum |
| Navigation items | Good | Maintain 48px+ |

### Motion Sensitivity

```css
/* Add to globals.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

| Component | Fix |
|-----------|-----|
| Progress ring | Add `aria-label="You have consumed 1200 of 2000 calories"` |
| Meal sections | Ensure h2/h3 heading hierarchy |
| Navigation | Add `aria-current="page"` to active item |

### Focus States

```css
/* Custom focus ring matching brand */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius);
}
```

---

## Mobile-Specific Optimizations

### Performance

| Optimization | Implementation |
|--------------|----------------|
| Lazy load meal sections below fold | Use `IntersectionObserver` |
| Virtual list for recipes | Use `react-virtual` for lists > 20 items |
| Image optimization | Ensure Next.js Image with blur placeholders |

### Touch UX

| Feature | Implementation |
|---------|----------------|
| Swipe gestures | Framer Motion drag on date navigation |
| Pull to refresh | Custom animation (consider egg cracking) |
| Long press | Quick actions on food entries |

### PWA Enhancements

| Feature | Implementation |
|---------|----------------|
| Offline indicator | Subtle banner when network unavailable |
| Background sync | Queue food entries when offline |
| Dynamic app badge | Show remaining calories |

### iOS-Specific

| Feature | Implementation |
|---------|----------------|
| Status bar | Match theme color |
| Splash screens | Generate for all device sizes |
| Haptics | `navigator.vibrate()` with fallback |

### Android-Specific

| Feature | Implementation |
|---------|----------------|
| Edge-to-edge | Respect navigation bar |
| Share target | Register for food photos |
| App shortcuts | Quick logging options |

---

## Implementation Roadmap

### Week 1: Quick Wins + Accessibility
- [ ] QW-1: Empty state CTAs in meal sections
- [ ] QW-2: Pending approvals badge on bottom nav
- [ ] QW-3: Enhanced date navigation affordance
- [ ] QW-4: Enhanced profile setup banner
- [ ] A11y: Color contrast fixes
- [ ] A11y: Touch target improvements
- [ ] A11y: Reduced motion support

### Week 2: Entry Method Surfacing
- [ ] QW-5: Floating barcode scanner button
- [ ] ME-1: Expandable FAB with multiple actions

### Week 3: Dashboard Enhancements
- [ ] ME-2: Swipe gesture for date navigation
- [ ] ME-3: Recipe quick access carousel
- [ ] ME-4: Weekly trend sparkline

### Week 4+: Partner UX & Onboarding
- [ ] ME-5: Inline partner approval toasts
- [ ] ME-6: Energy unit persistent toggle
- [ ] MF-1: Onboarding wizard
- [ ] MF-2: Partner activity feed

---

## Success Metrics

| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| Profile completion rate | 60% | 90%+ |
| Time to first food log | 5+ minutes | < 2 minutes |
| Partner approval latency | Unknown | < 1 hour |
| Daily active sessions | Baseline | +25% |
| Weekly retention | Baseline | +15% |

---

## File Reference

### High Priority Files

| File | Changes |
|------|---------|
| `src/app/(dashboard)/dashboard/page.tsx` | Date nav, profile banner, layout, weekly sparkline, recipe carousel |
| `src/components/dashboard/meal-section.tsx` | Empty state CTAs |
| `src/components/layout/bottom-nav.tsx` | Pending badge, FAB menu integration |
| `src/app/(dashboard)/search/page.tsx` | Floating barcode button |
| `src/components/dashboard/macro-card.tsx` | Visual hierarchy variants |
| `src/app/globals.css` | Reduced motion, contrast fixes, new animations |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/layout/fab-menu.tsx` | Expandable action menu |
| `src/components/dashboard/recent-recipes.tsx` | Recipe carousel |
| `src/components/dashboard/weekly-sparkline.tsx` | 7-day trend visualization |
| `src/components/ui/energy-unit-toggle.tsx` | Quick unit toggle chip |
| `src/hooks/use-approval-toasts.ts` | Inline approval handling |
| `src/components/onboarding/onboarding-wizard.tsx` | Main wizard component |
| `src/components/onboarding/step-*.tsx` | Individual wizard steps |
| `src/components/partner/partner-feed.tsx` | Activity feed |
| `src/components/partner/feed-item.tsx` | Feed item rendering |

---

## Notes

- **Excluded**: AI Meal Photo Recognition (can be revisited in future iteration)
- **Dependencies**: Some features (ME-5, MF-2) may require backend changes for real-time capabilities
- **Testing**: Each phase should include visual regression testing
- **Documentation**: Update component storybook as features are added

---

*Document maintained by Claude Code. Last updated: January 3, 2026*
