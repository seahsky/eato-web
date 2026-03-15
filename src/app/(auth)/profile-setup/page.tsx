"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { ACTIVITY_OPTIONS } from "@/lib/constants";
import type { Gender, ActivityLevel } from "@/server/client-types";

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
      toast.error("Failed to save profile. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-label="Setup progress"
      >
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
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Gender">
            {(["MALE", "FEMALE"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={gender === g}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border bg-card py-6 text-card-foreground shadow-warm-sm cursor-pointer transition-colors",
                  gender === g && "bg-primary/10 border-primary"
                )}
                onClick={() => setGender(g)}
              >
                {g === "MALE" ? <User className={cn("h-8 w-8", gender === g && "text-primary")} /> : <UserRound className={cn("h-8 w-8", gender === g && "text-primary")} />}
                <span className={cn("font-semibold", gender === g && "text-primary")}>{g === "MALE" ? "Male" : "Female"}</span>
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
              <Label htmlFor="setup-age">Age</Label>
              <Input
                id="setup-age"
                type="number"
                placeholder="25"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <Label htmlFor="setup-weight">Weight (kg)</Label>
              <Input
                id="setup-weight"
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
              <Label htmlFor="setup-height">Height (cm)</Label>
              <Input
                id="setup-height"
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
          <div className="space-y-2" role="radiogroup" aria-label="Activity level">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={activityLevel === opt.value}
                className={cn(
                  "w-full rounded-2xl border bg-card px-6 py-3 text-left text-card-foreground shadow-warm-sm cursor-pointer transition-colors",
                  activityLevel === opt.value && "bg-primary/10 border-primary"
                )}
                onClick={() => setActivityLevel(opt.value)}
              >
                <div className={cn("font-medium", activityLevel === opt.value && "text-primary")}>{opt.label}</div>
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
              <button
                key={opt.label}
                type="button"
                aria-pressed={calorieGoal === opt.daily}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-transform active:scale-95",
                  calorieGoal === opt.daily
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                onClick={() => setCalorieGoal(opt.daily)}
              >
                {COPY.onboardingGoalOption(opt.label, opt.weekly)}
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor="setup-calorie-goal">Custom daily goal (kcal)</Label>
            <Input
              id="setup-calorie-goal"
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
