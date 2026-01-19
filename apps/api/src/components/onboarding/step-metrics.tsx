"use client";

import { motion } from "framer-motion";
import { User, Scale, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/bmr";

interface StepMetricsProps {
  data: {
    age: number | "";
    weight: number | "";
    height: number | "";
    gender: Gender | null;
  };
  onChange: (data: Partial<StepMetricsProps["data"]>) => void;
  onNext: () => void;
}

export function StepMetrics({ data, onChange, onNext }: StepMetricsProps) {
  const isValid = data.age && data.weight && data.height && data.gender;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">About You</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll use this to calculate your daily calorie needs
        </p>
      </div>

      <div className="space-y-4">
        {/* Gender Selection */}
        <div className="space-y-2">
          <Label>Gender</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["MALE", "FEMALE"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => onChange({ gender })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  data.gender === gender
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-2xl mb-1 block">
                  {gender === "MALE" ? "👨" : "👩"}
                </span>
                <span className="text-sm font-medium capitalize">
                  {gender.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="25"
            value={data.age}
            onChange={(e) => onChange({ age: e.target.value ? Number(e.target.value) : "" })}
            min={13}
            max={120}
          />
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            placeholder="70"
            value={data.weight}
            onChange={(e) => onChange({ weight: e.target.value ? Number(e.target.value) : "" })}
            min={20}
            max={500}
            step={0.1}
          />
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Height (cm)
          </Label>
          <Input
            id="height"
            type="number"
            placeholder="175"
            value={data.height}
            onChange={(e) => onChange({ height: e.target.value ? Number(e.target.value) : "" })}
            min={50}
            max={300}
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </motion.div>
  );
}
