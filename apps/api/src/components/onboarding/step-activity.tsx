"use client";

import { motion } from "framer-motion";
import { Activity, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityLevel } from "@/lib/bmr";
import { ACTIVITY_LABELS } from "@/lib/bmr";

interface StepActivityProps {
  data: {
    activityLevel: ActivityLevel | null;
  };
  onChange: (data: Partial<StepActivityProps["data"]>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ACTIVITY_ICONS: Record<ActivityLevel, { icon: string; description: string }> = {
  SEDENTARY: {
    icon: "🪑",
    description: "Desk job, little to no exercise",
  },
  LIGHTLY_ACTIVE: {
    icon: "🚶",
    description: "Light walking, occasional workouts",
  },
  MODERATELY_ACTIVE: {
    icon: "🏃",
    description: "Regular exercise 3-5 days per week",
  },
  ACTIVE: {
    icon: "💪",
    description: "Intense exercise 6-7 days per week",
  },
  VERY_ACTIVE: {
    icon: "🏋️",
    description: "Athlete or very physical job",
  },
};

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "SEDENTARY",
  "LIGHTLY_ACTIVE",
  "MODERATELY_ACTIVE",
  "ACTIVE",
  "VERY_ACTIVE",
];

export function StepActivity({ data, onChange, onNext, onBack }: StepActivityProps) {
  const isValid = !!data.activityLevel;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
          <Activity className="w-8 h-8 text-secondary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Activity Level</h2>
        <p className="text-sm text-muted-foreground mt-1">
          How active are you on a typical week?
        </p>
      </div>

      <div className="space-y-3">
        {ACTIVITY_LEVELS.map((level, index) => {
          const { icon, description } = ACTIVITY_ICONS[level];
          const isSelected = data.activityLevel === level;

          return (
            <motion.button
              key={level}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChange({ activityLevel: level })}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-3xl">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {ACTIVITY_LABELS[level].split("(")[0].trim()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <span className="text-primary-foreground text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          size="lg"
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
