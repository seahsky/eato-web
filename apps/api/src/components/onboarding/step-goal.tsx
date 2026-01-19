"use client";

import { motion } from "framer-motion";
import { Target, ChevronLeft, TrendingDown, Minus, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnergyValue } from "@/components/ui/energy-value";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StepGoalProps {
  data: {
    calorieGoal: number | "";
  };
  calculatedValues: {
    bmr: number;
    tdee: number;
  };
  suggestions: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    calories: number;
    description: string;
  }>;
  onChange: (data: Partial<StepGoalProps["data"]>) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function StepGoal({
  data,
  calculatedValues,
  suggestions,
  onChange,
  onComplete,
  onBack,
  isSubmitting,
}: StepGoalProps) {
  const [useCustom, setUseCustom] = useState(false);
  const isValid = data.calorieGoal && data.calorieGoal >= 1000;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold">Your Calorie Goal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Based on your profile, here are your calculated needs
        </p>
      </div>

      {/* BMR/TDEE Display */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-xl">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Basal Metabolic Rate</p>
          <EnergyValue kcal={calculatedValues.bmr} className="font-semibold" />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Daily Energy Expenditure</p>
          <EnergyValue kcal={calculatedValues.tdee} className="font-semibold" />
        </div>
      </div>

      {/* Goal Suggestions */}
      {!useCustom && (
        <div className="space-y-2">
          <Label>Choose your goal</Label>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onChange({ calorieGoal: suggestion.calories })}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all",
                  data.calorieGoal === suggestion.calories
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {suggestion.icon}
                  <span className="text-sm font-medium">{suggestion.label}</span>
                </div>
                <EnergyValue kcal={suggestion.calories} className="text-xs text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Goal Toggle */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setUseCustom(!useCustom)}
          className="text-sm text-primary hover:underline"
        >
          {useCustom ? "Use suggested goals" : "Set custom goal"}
        </button>

        {useCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <Label htmlFor="customGoal">Custom daily calorie goal</Label>
            <Input
              id="customGoal"
              type="number"
              placeholder="2000"
              value={data.calorieGoal}
              onChange={(e) => onChange({ calorieGoal: e.target.value ? Number(e.target.value) : "" })}
              min={1000}
              max={10000}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 1,000 kcal for healthy tracking
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={!isValid || isSubmitting}
          size="lg"
          className="flex-1"
        >
          {isSubmitting ? "Saving..." : "Complete Setup"}
        </Button>
      </div>
    </motion.div>
  );
}

// Helper to generate goal suggestions based on TDEE
export function generateGoalSuggestions(tdee: number) {
  return [
    {
      id: "lose-fast",
      label: "Lose fast",
      icon: <TrendingDown className="w-4 h-4 text-orange-500" />,
      calories: Math.max(1200, tdee - 750),
      description: "-750 kcal/day",
    },
    {
      id: "lose",
      label: "Lose weight",
      icon: <TrendingDown className="w-4 h-4 text-amber-500" />,
      calories: Math.max(1200, tdee - 500),
      description: "-500 kcal/day",
    },
    {
      id: "lose-slow",
      label: "Lose slowly",
      icon: <TrendingDown className="w-4 h-4 text-yellow-500" />,
      calories: Math.max(1200, tdee - 250),
      description: "-250 kcal/day",
    },
    {
      id: "maintain",
      label: "Maintain",
      icon: <Minus className="w-4 h-4 text-blue-500" />,
      calories: tdee,
      description: "Stay at current weight",
    },
    {
      id: "gain-slow",
      label: "Gain slowly",
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      calories: tdee + 250,
      description: "+250 kcal/day",
    },
    {
      id: "gain",
      label: "Gain muscle",
      icon: <Zap className="w-4 h-4 text-emerald-500" />,
      calories: tdee + 500,
      description: "+500 kcal/day",
    },
  ];
}
