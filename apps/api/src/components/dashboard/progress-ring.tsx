"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { EnergyBalanceDisplay } from "@/components/ui/energy-balance-display";
import {
  getEnergyBalance,
  getEnergyBalanceColor,
} from "@/lib/energy-balance";

interface ProgressRingProps {
  current: number;
  goal: number;
  weeklyConsumed?: number;
  weeklyBudget?: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  current,
  goal,
  weeklyConsumed,
  weeklyBudget,
  size = 200,
  strokeWidth = 12,
}: ProgressRingProps) {
  const { percentage, color, circumference, offset } = useMemo(() => {
    const pct = goal > 0 ? Math.min((current / goal) * 100, 150) : 0;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const offs = circ - (Math.min(pct, 100) / 100) * circ;

    // Color based on energy balance level
    const level = getEnergyBalance(current, goal);
    const col = getEnergyBalanceColor(level);

    return { percentage: pct, color: col, circumference: circ, offset: offs };
  }, [current, goal, size, strokeWidth]);

  const remaining = Math.max(goal - current, 0);
  const over = current > goal ? current - goal : 0;

  // Accessibility label
  const ariaLabel =
    over > 0
      ? `You have consumed ${current} of ${goal} calories. ${over} calories over goal.`
      : `You have consumed ${current} of ${goal} calories. ${remaining} calories remaining.`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-label={ariaLabel}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
        />
      </svg>

      {/* Center content - Energy Balance Display */}
      <div className="z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <EnergyBalanceDisplay
            consumed={current}
            goal={goal}
            weeklyConsumed={weeklyConsumed}
            weeklyBudget={weeklyBudget}
            size="lg"
          />
        </motion.div>
      </div>
    </div>
  );
}
