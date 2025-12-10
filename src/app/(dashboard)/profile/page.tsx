"use client";

import { useState, useEffect } from "react";
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
import { Loader2, LogOut, Calculator, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { ACTIVITY_LABELS } from "@/lib/bmr";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityLevel, Gender } from "@/lib/bmr";

export default function ProfilePage() {
  const { signOut } = useClerk();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: user } = trpc.auth.getMe.useQuery();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATELY_ACTIVE");
  const [calorieGoal, setCalorieGoal] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setAge(profile.age.toString());
      setWeight(profile.weight.toString());
      setHeight(profile.height.toString());
      setGender(profile.gender as Gender);
      setActivityLevel(profile.activityLevel as ActivityLevel);
      setCalorieGoal(profile.calorieGoal.toString());
    }
  }, [profile]);

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
    upsertMutation.mutate({
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      activityLevel,
      calorieGoal: calorieGoal ? parseInt(calorieGoal) : undefined,
    });
  };

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
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
                  <p className="text-2xl font-bold">{Math.round(profile.bmr)}</p>
                  <p className="text-xs text-muted-foreground">BMR (kcal)</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{Math.round(profile.tdee)}</p>
                  <p className="text-xs text-muted-foreground">TDEE (kcal)</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{Math.round(profile.calorieGoal)}</p>
                  <p className="text-xs text-muted-foreground">Goal (kcal)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="goal">Daily Calorie Goal (optional)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  placeholder="Leave empty to use TDEE"
                  min={1000}
                  max={10000}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to automatically use your TDEE as your goal
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
