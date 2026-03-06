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

  const goalOptions = [
    { label: "Lose weight", value: Math.round(tdee - 500) },
    { label: "Maintain", value: Math.round(tdee) },
    { label: "Gain weight", value: Math.round(tdee + 500) },
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

      <h1 className="text-xl font-bold">Setup Your Profile</h1>

      {/* Step 0: Gender */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">What&apos;s your gender?</h2>
            <p className="text-sm text-muted-foreground">
              This helps us calculate your metabolic rate
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["MALE", "FEMALE"] as Gender[]).map((g) => (
              <Card
                key={g}
                className={`cursor-pointer transition-all ${gender === g ? "ring-2 ring-primary" : ""}`}
                onClick={() => setGender(g)}
              >
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  {g === "MALE" ? <User className="h-8 w-8" /> : <UserRound className="h-8 w-8" />}
                  <span className="font-semibold">{g === "MALE" ? "Male" : "Female"}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button className="w-full" disabled={!gender} onClick={() => setStep(1)}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 1: Body metrics */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Your body metrics</h2>
            <p className="text-sm text-muted-foreground">We&apos;ll use this for BMR calculation</p>
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">How active are you?</h2>
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                className={`cursor-pointer transition-all ${activityLevel === opt.value ? "ring-2 ring-primary" : ""}`}
                onClick={() => setActivityLevel(opt.value)}
              >
                <CardContent className="py-3">
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.description}</div>
                </CardContent>
              </Card>
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

      {/* Step 3: Calorie goal */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Set your daily goal</h2>

          {bmr > 0 && (
            <div className="flex gap-3">
              <Card className="flex-1">
                <CardContent className="py-3 text-center">
                  <div className="text-sm text-muted-foreground">BMR</div>
                  <div className="text-lg font-bold text-primary">{Math.round(bmr)} kcal</div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="py-3 text-center">
                  <div className="text-sm text-muted-foreground">TDEE</div>
                  <div className="text-lg font-bold text-primary">{Math.round(tdee)} kcal</div>
                </CardContent>
              </Card>
            </div>
          )}

          <p className="text-sm text-muted-foreground">Choose a target or set your own</p>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((opt) => (
              <Badge
                key={opt.label}
                variant={calorieGoal === opt.value ? "default" : "secondary"}
                className="cursor-pointer px-3 py-1.5 text-sm"
                onClick={() => setCalorieGoal(opt.value)}
              >
                {opt.label} ({opt.value} kcal)
              </Badge>
            ))}
          </div>
          <div>
            <Label>Custom goal (kcal)</Label>
            <Input
              type="number"
              min={800}
              max={10000}
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button className="flex-1" disabled={!calorieGoal || saving} onClick={handleComplete}>
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
