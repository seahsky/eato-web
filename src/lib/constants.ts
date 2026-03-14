import type { ActivityLevel } from "@/server/client-types";

export const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
  multiplier: number;
}[] = [
  { value: "SEDENTARY", label: "Sedentary", description: "Little or no exercise", multiplier: 1.2 },
  { value: "LIGHTLY_ACTIVE", label: "Lightly Active", description: "Light exercise 1-3 days/week", multiplier: 1.375 },
  { value: "MODERATELY_ACTIVE", label: "Moderately Active", description: "Moderate exercise 3-5 days/week", multiplier: 1.55 },
  { value: "ACTIVE", label: "Active", description: "Hard exercise 6-7 days/week", multiplier: 1.725 },
  { value: "VERY_ACTIVE", label: "Very Active", description: "Very hard exercise, physical job", multiplier: 1.9 },
];

export const MOOD_OPTIONS = [
  { emoji: "\u{1F60B}", label: "Delicious" },
  { emoji: "\u{1F60A}", label: "Happy" },
  { emoji: "\u{1F610}", label: "Neutral" },
  { emoji: "\u{1F922}", label: "Sick" },
  { emoji: "\u{1F971}", label: "Tired" },
] as const;
