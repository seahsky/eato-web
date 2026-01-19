"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { StepMetrics } from "./step-metrics";
import { StepActivity } from "./step-activity";
import { StepGoal, generateGoalSuggestions } from "./step-goal";
import { calculateBMR, calculateTDEE, type Gender, type ActivityLevel } from "@/lib/bmr";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

type WizardStep = 1 | 2 | 3;

interface WizardData {
  // Step 1: Metrics
  age: number | "";
  weight: number | "";
  height: number | "";
  gender: Gender | null;
  // Step 2: Activity
  activityLevel: ActivityLevel | null;
  // Step 3: Goal
  calorieGoal: number | "";
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const { width, height } = useWindowSize();
  const utils = trpc.useUtils();

  const [data, setData] = useState<WizardData>({
    age: "",
    weight: "",
    height: "",
    gender: null,
    activityLevel: null,
    calorieGoal: "",
  });

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const completeOnboardingMutation = trpc.profile.completeOnboarding.useMutation({
    onSuccess: () => {
      setShowCelebration(true);
      setTimeout(() => {
        toast.success("Profile setup complete!");
        onComplete();
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete setup");
    },
  });

  // Calculate BMR/TDEE when we have all required data
  const calculatedValues = (() => {
    if (
      data.age &&
      data.weight &&
      data.height &&
      data.gender &&
      data.activityLevel
    ) {
      const bmr = calculateBMR(
        data.weight as number,
        data.height as number,
        data.age as number,
        data.gender
      );
      const tdee = calculateTDEE(bmr, data.activityLevel);
      return { bmr, tdee };
    }
    return { bmr: 0, tdee: 0 };
  })();

  const goalSuggestions = calculatedValues.tdee
    ? generateGoalSuggestions(calculatedValues.tdee)
    : [];

  const handleComplete = () => {
    if (
      !data.age ||
      !data.weight ||
      !data.height ||
      !data.gender ||
      !data.activityLevel ||
      !data.calorieGoal
    ) {
      toast.error("Please complete all fields");
      return;
    }

    completeOnboardingMutation.mutate({
      age: data.age as number,
      weight: data.weight as number,
      height: data.height as number,
      gender: data.gender,
      activityLevel: data.activityLevel,
      calorieGoal: data.calorieGoal as number,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      {showCelebration && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Progress dots */}
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((s) => (
                <motion.div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step
                      ? "bg-primary"
                      : s < step
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                  animate={{
                    scale: s === step ? 1.2 : 1,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {step} of 3
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepMetrics
                key="metrics"
                data={{
                  age: data.age,
                  weight: data.weight,
                  height: data.height,
                  gender: data.gender,
                }}
                onChange={updateData}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepActivity
                key="activity"
                data={{
                  activityLevel: data.activityLevel,
                }}
                onChange={updateData}
                onNext={() => {
                  // Set default goal to TDEE (maintain) when moving to step 3
                  if (calculatedValues.tdee && !data.calorieGoal) {
                    updateData({ calorieGoal: calculatedValues.tdee });
                  }
                  setStep(3);
                }}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <StepGoal
                key="goal"
                data={{
                  calorieGoal: data.calorieGoal,
                }}
                calculatedValues={calculatedValues}
                suggestions={goalSuggestions}
                onChange={updateData}
                onComplete={handleComplete}
                onBack={() => setStep(2)}
                isSubmitting={completeOnboardingMutation.isPending}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Skip option */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Set up later
          </button>
        </div>
      </motion.div>
    </div>
  );
}
