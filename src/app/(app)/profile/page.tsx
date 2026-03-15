"use client";

import { useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Loader2, LogOut, Heart } from "lucide-react";
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

export default function ProfilePage() {
  const { signOut } = useClerk();
  const { data: me, isLoading } = trpc.auth.getMe.useQuery();
  const utils = trpc.useUtils();

  const profile = me?.profile;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [age, setAge] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [calorieGoal, setCalorieGoal] = useState<number | "">("");

  const upsertProfile = trpc.profile.upsert.useMutation();

  function startEditing() {
    if (!profile) return;
    setAge(profile.age);
    setWeight(profile.weight);
    setHeight(profile.height);
    setGender(profile.gender as Gender);
    setActivityLevel(profile.activityLevel as ActivityLevel);
    setCalorieGoal(profile.calorieGoal);
    setEditing(true);
  }

  async function handleSave() {
    if (!gender || !age || !weight || !height || !activityLevel || !calorieGoal) return;
    setSaving(true);
    try {
      await upsertProfile.mutateAsync({
        gender: gender as Gender,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        activityLevel: activityLevel as ActivityLevel,
        calorieGoal: Number(calorieGoal),
      });
      utils.auth.getMe.invalidate();
      setEditing(false);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  const bmr = profile?.bmr ?? 0;
  const tdee = profile?.tdee ?? 0;
  const weeklyBudget = profile?.calorieGoal ? Math.round(profile.calorieGoal * 7) : 0;

  const goalOptions = tdee > 0 ? [
    { label: "Lose weight", daily: Math.round(tdee - 500), weekly: Math.round((tdee - 500) * 7) },
    { label: "Maintain", daily: Math.round(tdee), weekly: Math.round(tdee * 7) },
    { label: "Gain weight", daily: Math.round(tdee + 500), weekly: Math.round((tdee + 500) * 7) },
  ] : [];

  return (
    <div className="mx-auto max-w-lg px-4 animate-fade-in">
      <div className="py-3">
        <h1 className="font-caveat text-xl text-foreground">{COPY.profileHeading}</h1>
      </div>

      {/* Physical Stats */}
      {profile && !editing && (
        <div className="border-b border-border/50 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Physical Stats</h2>
            <Button variant="outline" size="sm" onClick={startEditing}>
              Edit
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Gender</span>
              <p className="font-medium">{profile.gender === "MALE" ? "Male" : "Female"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Age</span>
              <p className="font-medium">{profile.age}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Weight</span>
              <p className="font-medium">{profile.weight} kg</p>
            </div>
            <div>
              <span className="text-muted-foreground">Height</span>
              <p className="font-medium">{profile.height} cm</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Activity Level</span>
              <p className="font-medium">
                {ACTIVITY_OPTIONS.find((a) => a.value === profile.activityLevel)?.label ?? profile.activityLevel}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <Card className="mb-4 animate-fade-in">
          <CardContent className="space-y-3 py-4">
            <h2 className="font-semibold">Edit Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gender</Label>
                <div className="flex gap-1" role="radiogroup" aria-label="Gender">
                  {(["MALE", "FEMALE"] as Gender[]).map((g) => (
                    <Button
                      key={g}
                      role="radio"
                      aria-checked={gender === g}
                      variant={gender === g ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setGender(g)}
                    >
                      {g === "MALE" ? "Male" : "Female"}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="profile-age">Age</Label>
                <Input
                  id="profile-age"
                  type="number"
                  min={13}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="profile-weight">Weight (kg)</Label>
                <Input
                  id="profile-weight"
                  type="number"
                  min={30}
                  max={300}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label htmlFor="profile-height">Height (cm)</Label>
                <Input
                  id="profile-height"
                  type="number"
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            <div>
              <Label>Activity Level</Label>
              <div className="mt-1 space-y-1" role="radiogroup" aria-label="Activity level">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={activityLevel === opt.value}
                    className={cn(
                      "w-full rounded-2xl border bg-card px-6 py-2 text-left text-card-foreground shadow-warm-sm cursor-pointer transition-colors",
                      activityLevel === opt.value && "ring-2 ring-primary"
                    )}
                    onClick={() => setActivityLevel(opt.value)}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!gender || !age || !weight || !height || !activityLevel || saving}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BMR / TDEE */}
      {profile && !editing && (
        <div className="border-b border-border/50 pb-4 mb-4 space-y-1 text-sm text-muted-foreground">
          <p>
            Your body burns ~<span className="font-semibold text-foreground">{Math.round(bmr)} kcal/day</span> at rest (BMR)
          </p>
          <p>
            With activity, you use ~<span className="font-semibold text-foreground">{Math.round(tdee)} kcal/day</span> (TDEE)
          </p>
        </div>
      )}

      {/* Weekly Budget Goal */}
      {profile && !editing && (
        <Card className="mb-4">
          <CardContent className="space-y-3 py-4">
            <h2 className="font-semibold">Weekly Budget</h2>
            <div className="text-2xl font-bold text-primary">{weeklyBudget.toLocaleString()} kcal/week</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(profile.calorieGoal)} kcal/day
            </p>
            {goalOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={Math.round(profile.calorieGoal) === opt.daily}
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-transform active:scale-95",
                      Math.round(profile.calorieGoal) === opt.daily
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    onClick={async () => {
                      try {
                        await upsertProfile.mutateAsync({
                          gender: profile.gender as Gender,
                          age: profile.age,
                          weight: profile.weight,
                          height: profile.height,
                          activityLevel: profile.activityLevel as ActivityLevel,
                          calorieGoal: opt.daily,
                        });
                        utils.auth.getMe.invalidate();
                        toast.success(`Goal updated to ${opt.weekly.toLocaleString()} kcal/week`);
                      } catch {
                        toast.error("Failed to update goal. Please try again.");
                      }
                    }}
                  >
                    {opt.label} ({opt.weekly.toLocaleString()}/week)
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Partner Section */}
      {me?.partner && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">{COPY.partnerHeading}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Linked with <span className="font-medium text-foreground">{me.partner.name ?? "Partner"}</span>
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/partner">View diary</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!me?.partner && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">{COPY.partnerHeading}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Track together with your partner
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/partner">Link partner</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={() => signOut({ redirectUrl: "/login" })}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
