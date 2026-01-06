# Eato Meal Diary Enhancement Plan

## Overview

This document outlines the plan to transform Eato from a calorie-focused tracker to a more engaging meal diary while retaining weight loss functionality.

### Confirmed Direction
- **Focus**: Weight loss (keep calorie tracking)
- **Logging**: Freeform daily log (remove breakfast/lunch/dinner categories) + optional photo
- **Motivation**: Streak tracking, progress milestones, weekly recaps
- **Partner**: Encouragement nudges
- **Scope**: Couples only

---

## Phase 1: Remove Meal Type Categories (Priority)

### Goal
Replace rigid meal categories (breakfast/lunch/dinner/snack) with a freeform chronological food feed.

### Schema Changes
**File**: `prisma/schema.prisma`

```prisma
// Change mealType from required to optional
mealType MealType?  // Was: mealType MealType
```

- Keep `MealType` enum for backward compatibility
- Existing entries retain their mealType values
- New entries can omit mealType entirely

### Backend Changes

**File**: `src/server/routers/food.ts`
- Make `mealType` optional in the Zod validation schema
- Update `log` mutation to not require mealType
- Update `update` mutation similarly

**File**: `src/server/routers/stats.ts`
- Modify `getDailySummary` to return flat `entries` array instead of `entriesByMeal` object
- Sort entries by `consumedAt` descending (most recent first)
- Update `getPartnerDailySummary` similarly

### Frontend Changes

**File**: `src/app/(dashboard)/dashboard/page.tsx`
- Replace 4 `MealSection` components with single `FoodFeed` component
- Maintain progress ring, macro cards, and partner card

**New File**: `src/components/dashboard/food-feed.tsx`
- Chronological list of food entries
- Show entry photo/icon, name, calories, time logged
- Pending entries shown with badge
- Expandable to show full nutritional details
- Edit/delete actions per entry

**File**: `src/components/food/food-entry-form.tsx`
- Remove meal type selector entirely
- Keep all other fields (food search, nutrition, serving size)

**File**: `src/components/dashboard/meal-section.tsx`
- DELETE or repurpose for other views

**File**: `src/components/partner/partner-meal-section.tsx`
- Update to display chronological feed instead of meal-grouped

### API Response Shape Change

**Before:**
```typescript
{
  entriesByMeal: {
    BREAKFAST: FoodEntry[],
    LUNCH: FoodEntry[],
    DINNER: FoodEntry[],
    SNACK: FoodEntry[]
  }
}
```

**After:**
```typescript
{
  entries: FoodEntry[]  // Sorted by consumedAt DESC
}
```

### Migration Steps
1. Run `npx prisma migrate dev` to make mealType optional
2. Update backend routers
3. Update frontend components
4. Test with existing data (should still work)
5. Run `npm run build` to verify no type errors

---

## Phase 2: Motivation Features

### Goal
Add engagement features proven to increase retention: streaks, milestones, and weekly recaps.

### Streak System

**Existing**: `getStreakData` in `src/server/routers/stats.ts`
- Already tracks consecutive days

**Enhancements**:

**New File**: `src/components/dashboard/streak-card.tsx`
- Display current streak prominently
- Fire emoji animation on milestones
- "Personal best" indicator when approaching record

**Streak Types**:
1. Logging streak (consecutive days with at least 1 entry)
2. Goal streak (consecutive days hitting calorie goal)

### Progress Milestones

**Milestone Definitions**:
| Days | Achievement |
|------|-------------|
| 7 | One week warrior |
| 14 | Two week streak |
| 30 | Monthly champion |
| 60 | Two month master |
| 100 | Century club |
| 365 | Year of wellness |

**New File**: `src/components/motivation/milestone-toast.tsx`
- Celebration animation when milestone hit
- Share option to partner

**Backend**: Add to `src/server/routers/stats.ts`
- `checkMilestones` function to detect new achievements
- Store achieved milestones in user record (or separate collection)

### Weekly Recaps

**New File**: `src/components/dashboard/weekly-recap.tsx`
- Summary card showing past week stats
- Accessible from dashboard (expandable or in profile)

**Stats to Display**:
- Total calories consumed
- Daily average
- Days logged (X of 7)
- Days on target
- Best day / Highest day
- Trend vs previous week (up/down arrow)

**Backend**: Enhance `getWeeklySummary` in stats router
- Add comparison to previous week
- Add streak info for the week

---

## Phase 3: Photo Upload (Cloudflare R2)

### Goal
Allow users to snap photos of their meals for visual journaling.

### Infrastructure Setup

**Cloudflare R2 Configuration**:
1. Create R2 bucket in Cloudflare dashboard
2. Generate API tokens with read/write access
3. Add environment variables:
   ```
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET_NAME=eato-photos
   R2_PUBLIC_URL=https://photos.eato.app  # or R2 dev URL
   ```

**New File**: `src/lib/r2.ts`
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadPhoto(file: Buffer, filename: string): Promise<string> {
  // Implementation
}
```

**New Dependency**:
```bash
npm install @aws-sdk/client-s3
```

### Schema Changes

**File**: `prisma/schema.prisma`
```prisma
model FoodEntry {
  // ... existing fields
  imageUrl       String?  // Product image from food database
  userPhotoUrl   String?  // NEW: User-uploaded photo
}
```

### API Changes

**New File**: `src/app/api/upload/route.ts`
- POST endpoint for image upload
- Accept multipart/form-data
- Resize/compress image (optional: use Sharp)
- Upload to R2
- Return public URL

### Frontend Changes

**New File**: `src/components/food/photo-picker.tsx`
- Camera capture button (mobile)
- Gallery picker button
- Preview of selected image
- Remove photo option

**File**: `src/components/food/food-entry-form.tsx`
- Add PhotoPicker component
- Upload photo on form submit
- Include userPhotoUrl in mutation payload

**File**: `src/components/dashboard/food-feed.tsx`
- Display user photo if present (larger than product thumbnail)
- Fallback to product imageUrl if no user photo
- Fallback to food icon if neither

---

## Phase 4: Enhanced Partner Nudges

### Goal
Make partner nudges more visible and actionable.

### Current Implementation
**File**: `src/server/routers/auth.ts`
- `sendNudge` endpoint exists
- Rate limited to 1 per 4 hours
- Sends push notification

### Enhancements

**UI Changes**:

**File**: `src/components/partner/partner-card.tsx` (or wherever partner status is shown)
- Add indicator when partner hasn't logged today
- Add one-tap "Send nudge" button
- Show time since last entry

**Contextual Nudge Messages**:
- "Hey! Don't forget to log your meals today"
- "Your partner is wondering what you ate"
- "Keep the streak going!"

**Rate Limit Display**:
- Show when next nudge available
- Disable button with countdown

---

## Breaking Changes Summary

### API Changes
| Endpoint | Before | After |
|----------|--------|-------|
| `stats.getDailySummary` | Returns `entriesByMeal` object | Returns flat `entries` array |
| `food.log` | Requires `mealType` | `mealType` optional |

### Mobile App Impact
If `eato-mobile` consumes the same API:
1. Update daily summary consumption
2. Remove meal type from food logging
3. Update UI to display chronological feed

---

## Implementation Checklist

### Phase 1
- [ ] Make mealType optional in schema
- [ ] Update food router validation
- [ ] Update stats router response shape
- [ ] Create FoodFeed component
- [ ] Update dashboard page
- [ ] Update food entry form
- [ ] Update partner views
- [ ] Run build, fix type errors
- [ ] Test with existing data

### Phase 2
- [ ] Create streak card component
- [ ] Define milestone thresholds
- [ ] Create milestone celebration UI
- [ ] Create weekly recap component
- [ ] Add milestone tracking to backend
- [ ] Integrate into dashboard

### Phase 3
- [ ] Setup Cloudflare R2 bucket
- [ ] Add R2 client library
- [ ] Create upload API route
- [ ] Add userPhotoUrl to schema
- [ ] Create photo picker component
- [ ] Update food entry form
- [ ] Update food feed to show photos

### Phase 4
- [ ] Add "partner hasn't logged" indicator
- [ ] Add one-tap nudge button
- [ ] Add contextual nudge messages
- [ ] Show nudge cooldown timer

---

## Research References

### Why This Approach Works
- **Photo journaling**: Finnish Olympic Committee uses See How You Eat for athletes
- **Streaks**: "Don't break the chain" is the most powerful retention tool in mobile apps
- **Accountability**: Adding check-ins increases success rate from 65% to 95%
- **Removing friction**: Users hate tedious meal categorization

### Sources
- [AteMate - Food Journaling](https://atemate.com/blog/best-food-journaling-app)
- [PMC - Gamification in Nutrition Apps](https://pmc.ncbi.nlm.nih.gov/articles/PMC11168059/)
- [Giodella - Accountability Apps](https://giodella.com/accountability-partner-apps/)
- [MyNetDiary - Avoid Food-Log Fatigue](https://www.mynetdiary.com/food-log.html)
