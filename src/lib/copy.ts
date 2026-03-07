/**
 * Centralized micro-copy for warm diary aesthetic.
 * Replace clinical tracking language with gentle, non-judgmental phrasing.
 */

export const COPY = {
  // Dashboard / Home
  fab: "What did you eat?",
  emptyDiaryTitle: "Your diary is empty today",
  emptyDiaryDescription: "What's the first thing you ate?",
  emptyDiaryCta: "Write it down",
  dailyTotal: (kcal: number) => `Today so far: ${Math.round(kcal)} kcal`,
  weeklyContext: (day: number, consumed: number, budget: number) =>
    `Day ${day} \u2014 ${Math.round(consumed).toLocaleString()} of ${Math.round(budget).toLocaleString()} kcal this week`,

  // Search
  searchPlaceholder: "e.g., chicken breast 150g, rice 200g",
  searchNoResults: (query: string) =>
    `Hmm, I couldn't find "${query}". Try describing it differently?`,
  searchNoResultsCta: "Describe it yourself",

  // Add / Entry
  addHeading: "Write an entry",
  addManualHeading: "Describe it yourself",
  addButton: "Save",
  addConfirmation: (kcal: number) => `Got it! That's about ~${Math.round(kcal)} kcal`,
  moodPlaceholder: "Any thoughts about this meal?",

  // Weekly
  weekHeading: "Your Week",
  weekBudgetLabel: (consumed: number, budget: number) =>
    `${Math.round(consumed).toLocaleString()} of ${Math.round(budget).toLocaleString()} kcal`,
  weekRemainingLabel: (remaining: number) =>
    `${Math.round(remaining).toLocaleString()} kcal left for the rest of your week`,
  weekOverBudget: "A little over this week, and that's okay. Every week is a fresh start.",

  // History
  historyHeading: "History",

  // Partner
  partnerHeading: "Your partner",
  partnerDiaryBanner: (name: string) => `${name}'s diary`,

  // Profile
  profileHeading: "Profile",
  weeklyBudgetDisplay: (tdee: number, weekly: number) =>
    `Your TDEE is about ${Math.round(tdee).toLocaleString()} kcal/day \u00d7 7 = ${Math.round(weekly).toLocaleString()} kcal/week`,

  // Onboarding
  onboardingTitle: "Let's get to know you",
  onboardingGoalHeading: "Your weekly budget",
  onboardingWeeklyBudget: (weekly: number) =>
    `Your week has ${Math.round(weekly).toLocaleString()} kcal to work with`,
  onboardingGoalOption: (label: string, weekly: number) =>
    `${label} (${Math.round(weekly).toLocaleString()}/week)`,

  // Calorie ring
  calorieRingLabel: (consumed: number, budget: number) =>
    `${Math.round(consumed).toLocaleString()} of ${Math.round(budget).toLocaleString()} kcal`,

  // Generic
  noEntriesDay: "Nothing here yet",
  noEntriesPartnerDay: "Nothing logged yet today",

  // Edit screen
  editHeading: "Update entry",
  editNotFound: "Hmm, I can't find that one",
  deleteTitle: "Remove this entry?",
  deleteDescription: "This will remove the entry from your diary. You can always log it again later.",

  // Partner screen
  partnerShareTitle: "Share your link",
  partnerShareDescription: "Generate a code to share with your partner.",
  partnerEnterTitle: "Got a code?",
  partnerEnterDescription: "Enter the 6-character code your partner shared.",
  partnerUnlinkTitle: (name: string) => `Unlink from ${name}?`,
  partnerUnlinkDescription: "You won't be able to see each other's diary anymore. You can always re-link later.",

  // Onboarding
  onboardingGenderHelp: "This helps us figure out your calorie needs",
  onboardingBmrLabel: "Base calories",
  onboardingBmrSubtitle: "(at rest)",
  onboardingTdeeLabel: "Daily calories",
  onboardingTdeeSubtitle: "(with activity)",
} as const;
