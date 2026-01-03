"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel } from "@/lib/energy";

interface ProgressRingProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  current,
  goal,
  size = 200,
  strokeWidth = 12,
}: ProgressRingProps) {
  const { percentage, color, circumference, offset } = useMemo(() => {
    const pct = Math.min((current / goal) * 100, 150);
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const offs = circ - (Math.min(pct, 100) / 100) * circ;

    // Color based on progress
    let col = "var(--success)"; // Green - under goal
    if (pct >= 85 && pct < 100) {
      col = "var(--chart-3)"; // Orange - approaching
    } else if (pct >= 100) {
      col = "var(--destructive)"; // Red - over goal
    }

    return { percentage: pct, color: col, circumference: circ, offset: offs };
  }, [current, goal, size, strokeWidth]);

  const remaining = Math.max(goal - current, 0);
  const over = current > goal ? current - goal : 0;

  // Accessibility label
  const ariaLabel = over > 0
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

      {/* Center content */}
      <CenterContent
        current={current}
        goal={goal}
        over={over}
        remaining={remaining}
      />
    </div>
  );
}

function CenterContent({
  current,
  goal,
  over,
  remaining,
}: {
  current: number;
  goal: number;
  over: number;
  remaining: number;
}) {
  const { energyUnit } = useEnergyUnit();

  return (
    <div className="text-center z-10">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <EnergyValue
          kcal={current}
          showUnit={false}
          toggleable
          className="text-4xl font-bold tracking-tight font-serif"
        />
        <p className="text-sm text-muted-foreground mt-1">
          of {convertEnergy(goal, energyUnit)} {getEnergyLabel(energyUnit)}
        </p>
      </motion.div>
      <motion.div
        className="mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {over > 0 ? (
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            +{convertEnergy(over, energyUnit)} {getEnergyLabel(energyUnit)} over
          </span>
        ) : (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
            {convertEnergy(remaining, energyUnit)} {getEnergyLabel(energyUnit)} remaining
          </span>
        )}
      </motion.div>
    </div>
  );
}
