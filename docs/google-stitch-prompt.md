# Google Stitch Prompt — Eato App Mockups

Design a mobile app called "Eato" — a calorie tracking diary for couples. Eato helps two partners track what they eat together, share their food diaries, and motivate each other with streaks, badges, and a pixel pet companion. The tagline is "Your food diary, together." It is not a clinical health app — it feels like a warm, personal journal you share with someone you care about.

## Visual Identity

- **Primary color:** Warm terracotta/burnt orange (#C4704B). Used for buttons, active states, and accents.
- **Secondary color:** Sage green (#8FC298). Used for secondary elements and data visualization.
- **Background:** Off-white cream (#FDF8F4). Warm, not stark white.
- **Text color:** Dark brown (#3D2A1F), not black. Everything feels warm.
- **Destructive/error:** Muted red.
- **Cards:** Slightly warmer white than the background, with soft warm-tinted shadows (never gray shadows). Large rounded corners (16px+).
- **Buttons:** Fully rounded (pill shape), 44px minimum touch target. Primary buttons are terracotta with white text. Subtle press animation (scale down to 97%).
- **Typography:** "Nunito" (rounded, friendly sans-serif) for body text. "Caveat" (handwritten script) for page titles and headings — this gives the app a personal, diary-like feel.
- **Subtle paper-like grain texture** over the entire background at very low opacity.
- **No harsh borders.** Separation comes from soft shadows and subtle background differences.

## App Logo

A rounded square icon with a terracotta gradient background. Two organic petal/leaf shapes — one cream, one sage green — arranged symmetrically with a small heart cutout in the center where the petals meet, revealing the terracotta behind it. Minimal and organic.

## Screens

### 1. Dashboard / Daily Diary

A circular calorie ring at the top showing consumed vs. budget (e.g., "1,240 of 2,100 kcal") with a gradient stroke from cream to terracotta. Below it, a weekly context line in small text: "Day 4 — 6,800 of 14,000 kcal this week." Below that, a vertical list of food entry cards — each card shows a food photo (rounded top corners), the food name, serving size, calorie count, and a small mood emoji. A floating action button (terracotta pill) at the bottom right says "What did you eat?"

### 2. Add Food Entry

A search screen with the heading "Write an entry" in Caveat handwriting font. A large rounded search input with placeholder "e.g., chicken breast 150g, rice 200g". Below, search results as simple list items with food name, serving size, and calories. At the bottom, a "Describe it yourself" link for manual entry. The confirmation toast says "Got it! That's about ~450 kcal."

### 3. Weekly Overview

Heading "Your Week" in Caveat font. A 7-day strip at the top (Mon–Sun) as small rounded buttons — today has a terracotta ring, days with entries have a small terracotta dot below. A calorie ring for the weekly total. Below, a breakdown showing consumed vs. budget with remaining calories. A gentle message if over budget: "A little over this week, and that's okay. Every week is a fresh start."

### 4. Partner View

When linked: heading shows the partner's name in Caveat font. Their diary entries displayed the same way as your own (food cards in a list). When not linked: two cards — "Share your link" with a generated 6-character code displayed in large monospace font with a copy button, and "Got a code?" with a text input for entering a partner's code. An unlink option at the bottom as a subtle destructive outline button.

### 5. Profile / Settings

Heading "Profile" in Caveat font. User avatar at top. Stats showing TDEE, weekly budget, current streak. A section for notification preferences (toggle switches). Activity level selector. Goal selection (lose, maintain, gain). Clean card-based layout.

### 6. Onboarding Flow

Title "Let's get to know you" in Caveat font. Step-by-step cards collecting: gender (with helper text "This helps us figure out your calorie needs"), height, weight, age, activity level. Final screen shows calculated BMR and TDEE with the weekly budget. Warm, encouraging tone throughout.

### 7. Streaks & Achievements

A gamification screen showing: current daily streak with a flame icon that grows (small → medium → large → epic), a grid of achievement badges (40 total) organized in categories — Consistency, Logging, Goals, Partner. Each badge has a Lucide icon and rarity tier (Common, Uncommon, Rare, Epic, Legendary). Locked badges are dimmed. Milestone celebrations when hitting 7, 30, 90, 365 days.

### 8. Pixel Pet

A small pixel-art companion creature (could be a cat, dog, bunny, hamster, bird, or frog). It has a body color, eye style, pattern, and accessory (bow, hat, scarf, glasses, flower). It gently bobs when idle, bounces when tapped, and shows floating hearts when the user hits their calorie goal. The pet's state reflects the user's engagement — active and sparkly when logging consistently, droopy when inactive.

### 9. History

Heading "History" in Caveat font. A calendar or scrollable list of past days. Each day shows total calories and a small indicator of whether the goal was met (green dot) or not. Tapping a day expands to show that day's food entries.

### 10. Empty States

When the diary has no entries: a centered card with a subtle icon, the title "Your diary is empty today" in Caveat font, description "What's the first thing you ate?", and a terracotta pill button "Write it down." Gentle fade-in animation.

## Overall Mood

Warm, intimate, non-judgmental. Like a shared journal between two people who care about each other's wellbeing. The handwritten headings, earthy palette, pixel pet, and gentle copy create an experience that feels personal — not like a medical tool. Dark mode support with the same warm tones adapted for dark backgrounds (dark brown, not pure black).
