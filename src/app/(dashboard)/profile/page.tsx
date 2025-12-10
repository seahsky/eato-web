"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, LogOut, Calculator, Target, Activity, Check, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { ACTIVITY_LABELS } from "@/lib/bmr";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { getEnergyLabel, convertEnergy, convertToKcal, type EnergyUnit } from "@/lib/energy";
import type { ActivityLevel, Gender } from "@/lib/bmr";

export default function ProfilePage() {
  const { signOut } = useClerk();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: user } = trpc.auth.getMe.useQuery();
  const { energyUnit, setEnergyUnit } = useEnergyUnit();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATELY_ACTIVE");
  const [calorieGoal, setCalorieGoal] = useState("");

  // Track previous energy unit to detect changes
  const [prevEnergyUnit, setPrevEnergyUnit] = useState<EnergyUnit>(energyUnit);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setAge(profile.age.toString());
      setWeight(profile.weight.toString());
      setHeight(profile.height.toString());
      setGender(profile.gender as Gender);
      setActivityLevel(profile.activityLevel as ActivityLevel);
      // Convert stored kcal to user's preferred unit for display
      const displayGoal = convertEnergy(profile.calorieGoal, energyUnit);
      setCalorieGoal(displayGoal.toString());
      setPrevEnergyUnit(energyUnit);
    }
  }, [profile, energyUnit]);

  // Convert goal when energy unit changes (without profile reload)
  useEffect(() => {
    if (prevEnergyUnit !== energyUnit && calorieGoal) {
      // Convert from old unit to kcal, then to new unit
      const goalInKcal = convertToKcal(parseInt(calorieGoal), prevEnergyUnit);
      const newDisplayGoal = convertEnergy(goalInKcal, energyUnit);
      setCalorieGoal(newDisplayGoal.toString());
      setPrevEnergyUnit(energyUnit);
    }
  }, [energyUnit, prevEnergyUnit, calorieGoal]);

  // Compute calorie suggestions based on TDEE
  const calorieSuggestions = useMemo(() => {
    if (!profile?.tdee) return [];
    const tdee = profile.tdee;
    return [
      { type: 'lose-aggressive', label: 'Lose ~1.5 lb/wk', kcal: Math.max(1200, tdee - 750), icon: TrendingDown, color: 'text-orange-500' },
      { type: 'lose-moderate', label: 'Lose ~1 lb/wk', kcal: Math.max(1200, tdee - 500), icon: TrendingDown, color: 'text-amber-500' },
      { type: 'lose-mild', label: 'Lose ~0.5 lb/wk', kcal: Math.max(1200, tdee - 250), icon: TrendingDown, color: 'text-yellow-500' },
      { type: 'maintain', label: 'Maintain weight', kcal: tdee, icon: Minus, color: 'text-primary' },
      { type: 'gain-mild', label: 'Gain ~0.5 lb/wk', kcal: tdee + 250, icon: TrendingUp, color: 'text-green-500' },
      { type: 'gain-moderate', label: 'Gain ~1 lb/wk', kcal: tdee + 500, icon: TrendingUp, color: 'text-emerald-500' },
    ];
  }, [profile?.tdee]);

  // Compute goal input bounds based on energy unit
  const goalMin = useMemo(() => convertEnergy(1000, energyUnit), [energyUnit]);
  const goalMax = useMemo(() => convertEnergy(10000, energyUnit), [energyUnit]);

  const upsertMutation = trpc.profile.upsert.useMutation({
    onSuccess: (data) => {
      toast.success("Profile updated!");
      setCalorieGoal(data.calorieGoal.toString());
      utils.profile.get.invalidate();
      utils.auth.getMe.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert displayed goal back to kcal for storage
    const goalInKcal = calorieGoal ? convertToKcal(parseInt(calorieGoal), energyUnit) : undefined;
    upsertMutation.mutate({
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      activityLevel,
      calorieGoal: goalInKcal,
    });
  };

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const handleSelectSuggestion = (kcal: number) => {
    // Convert suggestion (in kcal) to user's preferred display unit
    const displayValue = convertEnergy(kcal, energyUnit);
    setCalorieGoal(displayValue.toString());
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-serif font-semibold">Profile</h1>
          {user && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* BMR Info Card */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <EnergyValue
                    kcal={profile.bmr}
                    showUnit={false}
                    toggleable
                    className="text-2xl font-bold"
                  />
                  <p className="text-xs text-muted-foreground">BMR ({getEnergyLabel(energyUnit)})</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <EnergyValue
                    kcal={profile.tdee}
                    showUnit={false}
                    toggleable
                    className="text-2xl font-bold"
                  />
                  <p className="text-xs text-muted-foreground">TDEE ({getEnergyLabel(energyUnit)})</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <EnergyValue
                    kcal={profile.calorieGoal}
                    showUnit={false}
                    toggleable
                    className="text-2xl font-bold"
                  />
                  <p className="text-xs text-muted-foreground">Goal ({getEnergyLabel(energyUnit)})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Calorie Goal Suggestions */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 px-1">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Goal Suggestions
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {calorieSuggestions.map((suggestion) => {
              const Icon = suggestion.icon;
              const selected = parseInt(calorieGoal) === suggestion.kcal;

              return (
                <motion.button
                  key={suggestion.type}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion.kcal)}
                  className={cn(
                    "relative p-3 rounded-xl border-2 transition-all text-left",
                    "hover:bg-accent/50 active:scale-[0.98]",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  {selected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-4 h-4", suggestion.color)} />
                    <span className="text-xs text-muted-foreground">{suggestion.label}</span>
                  </div>
                  <EnergyValue kcal={suggestion.kcal} showUnit toggleable className="text-lg font-semibold" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Stats</CardTitle>
            <CardDescription>
              Update your stats to calculate your daily calorie needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    min={13}
                    max={120}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    min={20}
                    max={500}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    min={50}
                    max={300}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="energyUnit">Energy Unit</Label>
                <Select
                  value={energyUnit}
                  onValueChange={(v) => setEnergyUnit(v as EnergyUnit)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KCAL">Kilocalories (kcal)</SelectItem>
                    <SelectItem value="KJ">Kilojoules (kJ)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tap any energy value to temporarily see the other unit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Daily Goal ({getEnergyLabel(energyUnit)}) (optional)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  placeholder="Leave empty to use TDEE"
                  min={goalMin}
                  max={goalMax}
                />
                <p className="text-xs text-muted-foreground">
                  Select a suggestion above or enter a custom goal in {getEnergyLabel(energyUnit)}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : profile ? (
                  "Update Profile"
                ) : (
                  "Save Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
