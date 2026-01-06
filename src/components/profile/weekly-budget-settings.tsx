"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Calendar, Eye, EyeOff } from "lucide-react";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel } from "@/lib/energy";

const WEEK_DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

interface WeeklyBudgetSettingsProps {
  dailyGoal: number;
  weeklyBudget: number | null | undefined;
  weekStartDay: number;
  displayMode: "QUALITATIVE" | "EXACT";
}

export function WeeklyBudgetSettings({
  dailyGoal,
  weeklyBudget: initialWeeklyBudget,
  weekStartDay: initialWeekStartDay,
  displayMode: initialDisplayMode,
}: WeeklyBudgetSettingsProps) {
  const { energyUnit } = useEnergyUnit();
  const utils = trpc.useUtils();

  const [useCustomBudget, setUseCustomBudget] = useState(!!initialWeeklyBudget);
  const [customBudget, setCustomBudget] = useState(
    initialWeeklyBudget?.toString() ?? (dailyGoal * 7).toString()
  );
  const [weekStartDay, setWeekStartDay] = useState(initialWeekStartDay.toString());
  const [showQualitative, setShowQualitative] = useState(initialDisplayMode === "QUALITATIVE");

  const autoBudget = dailyGoal * 7;

  // Sync with props
  useEffect(() => {
    setUseCustomBudget(!!initialWeeklyBudget);
    setCustomBudget(initialWeeklyBudget?.toString() ?? (dailyGoal * 7).toString());
    setWeekStartDay(initialWeekStartDay.toString());
    setShowQualitative(initialDisplayMode === "QUALITATIVE");
  }, [initialWeeklyBudget, initialWeekStartDay, initialDisplayMode, dailyGoal]);

  const updateWeeklyBudget = trpc.profile.updateWeeklyBudget.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.stats.getWeeklyBudgetStatus.invalidate();
      toast.success("Weekly budget updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateDisplayMode = trpc.profile.updateDisplayMode.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Display mode updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveWeeklyBudget = () => {
    const budgetValue = useCustomBudget ? parseInt(customBudget) : null;
    updateWeeklyBudget.mutate({
      weeklyCalorieBudget: budgetValue,
      weekStartDay: parseInt(weekStartDay),
    });
  };

  const handleToggleDisplayMode = () => {
    const newMode = showQualitative ? "EXACT" : "QUALITATIVE";
    setShowQualitative(!showQualitative);
    updateDisplayMode.mutate({ displayMode: newMode });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Weekly Budget
        </CardTitle>
        <CardDescription>
          Configure your weekly calorie budget and display preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              {showQualitative ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              Simple View
            </Label>
            <p className="text-sm text-muted-foreground">
              {showQualitative
                ? "Showing qualitative balance (Light/Balanced/Full)"
                : "Showing exact calorie numbers"}
            </p>
          </div>
          <Switch
            checked={showQualitative}
            onCheckedChange={handleToggleDisplayMode}
            disabled={updateDisplayMode.isPending}
          />
        </div>

        {/* Week Start Day */}
        <div className="space-y-2">
          <Label htmlFor="weekStartDay">Week Starts On</Label>
          <Select value={weekStartDay} onValueChange={setWeekStartDay}>
            <SelectTrigger id="weekStartDay">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {WEEK_DAYS.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Budget Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Custom Weekly Budget</Label>
            <p className="text-sm text-muted-foreground">
              Auto: {convertEnergy(autoBudget, energyUnit).toLocaleString()}{" "}
              {getEnergyLabel(energyUnit)} (daily × 7)
            </p>
          </div>
          <Switch
            checked={useCustomBudget}
            onCheckedChange={setUseCustomBudget}
          />
        </div>

        {/* Custom Budget Input */}
        {useCustomBudget && (
          <div className="space-y-2">
            <Label htmlFor="customBudget">
              Weekly Budget ({getEnergyLabel(energyUnit)})
            </Label>
            <Input
              id="customBudget"
              type="number"
              min={7000}
              max={70000}
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              placeholder={autoBudget.toString()}
            />
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSaveWeeklyBudget}
          disabled={updateWeeklyBudget.isPending}
          className="w-full"
        >
          {updateWeeklyBudget.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Weekly Settings
        </Button>
      </CardContent>
    </Card>
  );
}
