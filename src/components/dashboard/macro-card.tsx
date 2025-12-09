"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface MacroCardProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color: string;
  delay?: number;
}

export function MacroCard({
  label,
  current,
  goal,
  unit = "g",
  color,
  delay = 0,
}: MacroCardProps) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm font-semibold">
          {Math.round(current)}/{goal}{unit}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        style={{ "--progress-color": color } as React.CSSProperties}
      />
    </motion.div>
  );
}
