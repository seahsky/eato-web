"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/trpc/react";
import { COPY } from "@/lib/copy";
import type { Gender, ActivityLevel } from "@/server/client-types";

const ACTIVITY_OPTIONS: {
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

function calculateBmr(weight: number, height: number, age: number, gender: Gender): number {
  if (gender === "MALE") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [calorieGoal, setCalorieGoal] = useState<number | "">("");

  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();

  const bmr =
    gender && age && weight && height
      ? calculateBmr(Number(weight), Number(height), Number(age), gender)
      : 0;
  const tdee =
    bmr && activityLevel
      ? bmr * (ACTIVITY_OPTIONS.find((a) => a.value === activityLevel)?.multiplier ?? 1)
      : 0;

  const weeklyTdee = Math.round(tdee * 7);
  const goalOptions = [
    { label: "Lose weight", daily: Math.round(tdee - 500), weekly: Math.round((tdee - 500) * 7) },
    { label: "Maintain", daily: Math.round(tdee), weekly: weeklyTdee },
    { label: "Gain weight", daily: Math.round(tdee + 500), weekly: Math.round((tdee + 500) * 7) },
  ];

  async function handleComplete() {
    if (!gender || !age || !weight || !height || !activityLevel || !calorieGoal) return;
    setSaving(true);
    try {
      await completeOnboarding.mutateAsync({
        gender,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        activityLevel,
        calorieGoal: Number(calorieGoal),
      });
      router.replace("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
        />
      </div>

      <h1 className="font-caveat text-2xl">{COPY.onboardingTitle}</h1>

      {/* Step 0: Gender */}
      {step === 0 && (
        <div className="animate-fade-in space-y-4" key={0}>
          <div>
            <h2 className="text-lg font-semibold">What&apos;s your gender?</h2>
            <p className="text-sm text-muted-foreground">
              {COPY.onboardingGenderHelp}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["MALE", "FEMALE"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`flex flex-col items-center gap-2 rounded-2xl border bg-card py-6 text-card-foreground shadow-warm-sm cursor-pointer transition-all ${gender === g ? "ring-2 ring-primary" : ""}`}
                onClick={() => setGender(g)}
              >
                {g === "MALE" ? <User className="h-8 w-8" /> : <UserRound className="h-8 w-8" />}
                <span className="font-semibold">{g === "MALE" ? "Male" : "Female"}</span>
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!gender} onClick={() => setStep(1)}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 1: Body metrics */}
      {step === 1 && (
        <div className="animate-fade-in space-y-4" key={1}>
          <div>
            <h2 className="text-lg font-semibold">Tell us about yourself</h2>
            <p className="text-sm text-muted-foreground">We&apos;ll use this for your weekly budget</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                placeholder="25"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                placeholder="70"
                min={30}
                max={300}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input
                type="number"
                placeholder="170"
                min={100}
                max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button className="flex-1" disabled={!age || !weight || !height} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Activity level */}
      {step === 2 && (
        <div className="animate-fade-in space-y-4" key={2}>
          <h2 className="text-lg font-semibold">How active are you?</h2>
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full rounded-2xl border bg-card px-6 py-3 text-left text-card-foreground shadow-warm-sm cursor-pointer transition-all ${activityLevel === opt.value ? "ring-2 ring-primary" : ""}`}
                onClick={() => setActivityLevel(opt.value)}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-muted-foreground">{opt.description}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!activityLevel}
              onClick={() => {
                if (!calorieGoal && tdee) setCalorieGoal(Math.round(tdee));
                setStep(3);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Weekly budget */}
      {step === 3 && (
        <div className="animate-fade-in space-y-4" key={3}>
          <h2 className="text-lg font-semibold">{COPY.onboardingGoalHeading}</h2>

          {weeklyTdee > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4 text-center">
                <p className="font-caveat text-lg text-foreground">
                  {COPY.onboardingWeeklyBudget(weeklyTdee)}
                </p>
              </CardContent>
            </Card>
          )}

          {bmr > 0 && (
            <div className="flex gap-3">
              <Card className="flex-1">
                <CardContent className="py-3 text-center">
                  <div className="text-sm text-muted-foreground">{COPY.onboardingBmrLabel}</div>
                  <div className="text-lg font-bold text-primary">{Math.round(bmr)} kcal</div>
                  <div className="text-xs text-muted-foreground">{COPY.onboardingBmrSubtitle}</div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="py-3 text-center">
                  <div className="text-sm text-muted-foreground">{COPY.onboardingTdeeLabel}</div>
                  <div className="text-lg font-bold text-primary">{Math.round(tdee)} kcal/day</div>
                  <div className="text-xs text-muted-foreground">{COPY.onboardingTdeeSubtitle}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <p className="text-sm text-muted-foreground">Choose a target or set your own</p>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((opt) => (
              <Badge
                key={opt.label}
                variant={calorieGoal === opt.daily ? "default" : "secondary"}
                className="cursor-pointer px-3 py-1.5 text-sm active:scale-95 transition-transform"
                onClick={() => setCalorieGoal(opt.daily)}
              >
                {COPY.onboardingGoalOption(opt.label, opt.weekly)}
              </Badge>
            ))}
          </div>
          <div>
            <Label>Custom daily goal (kcal)</Label>
            <Input
              type="number"
              min={800}
              max={10000}
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value ? Number(e.target.value) : "")}
            />
            {calorieGoal && (
              <p className="mt-1 text-xs text-muted-foreground">
                = {(Number(calorieGoal) * 7).toLocaleString()} kcal/week
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button className="flex-1" disabled={!calorieGoal || saving} onClick={handleComplete}>
              {saving ? "Saving..." : "Let's go!"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
