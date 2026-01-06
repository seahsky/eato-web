"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDisplayMode } from "@/contexts/display-mode-context";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel } from "@/lib/energy";
import {
  getEnergyBalance,
  getEnergyBalanceLabel,
  getEnergyBalanceColor,
  getWeeklyStatusMessage,
  isOnTrack,
  type EnergyBalanceLevel,
} from "@/lib/energy-balance";
import { cn } from "@/lib/utils";

interface EnergyBalanceDisplayProps {
  /** Current daily calories consumed */
  consumed: number;
  /** Daily calorie goal */
  goal: number;
  /** Weekly calories consumed (optional) */
  weeklyConsumed?: number;
  /** Weekly calorie budget (optional) */
  weeklyBudget?: number;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function EnergyBalanceDisplay({
  consumed,
  goal,
  weeklyConsumed,
  weeklyBudget,
  className,
  size = "lg",
}: EnergyBalanceDisplayProps) {
  const { displayMode, toggleDisplayMode, isQualitative } = useDisplayMode();
  const { energyUnit } = useEnergyUnit();

  const dailyBalance = getEnergyBalance(consumed, goal);
  const weeklyBalance = weeklyBudget
    ? getEnergyBalance(weeklyConsumed ?? 0, weeklyBudget)
    : null;

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const subTextClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-sm",
  };

  return (
    <motion.button
      type="button"
      onClick={toggleDisplayMode}
      className={cn(
        "text-center cursor-pointer",
        "hover:opacity-90 active:scale-[0.98] transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg p-2 -m-2",
        className
      )}
      whileTap={{ scale: 0.98 }}
      aria-label={
        isQualitative
          ? "Showing qualitative balance, tap for exact numbers"
          : "Showing exact numbers, tap for qualitative balance"
      }
    >
      <AnimatePresence mode="wait">
        {isQualitative ? (
          <QualitativeView
            key="qualitative"
            dailyBalance={dailyBalance}
            weeklyBalance={weeklyBalance}
            sizeClasses={sizeClasses[size]}
            subTextClasses={subTextClasses[size]}
          />
        ) : (
          <ExactView
            key="exact"
            consumed={consumed}
            goal={goal}
            weeklyConsumed={weeklyConsumed}
            weeklyBudget={weeklyBudget}
            energyUnit={energyUnit}
            sizeClasses={sizeClasses[size]}
            subTextClasses={subTextClasses[size]}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function QualitativeView({
  dailyBalance,
  weeklyBalance,
  sizeClasses,
  subTextClasses,
}: {
  dailyBalance: EnergyBalanceLevel;
  weeklyBalance: EnergyBalanceLevel | null;
  sizeClasses: string;
  subTextClasses: string;
}) {
  const label = getEnergyBalanceLabel(dailyBalance);
  const color = getEnergyBalanceColor(dailyBalance);

  // Weekly status message
  const weeklyMessage = weeklyBalance
    ? isOnTrack(weeklyBalance)
      ? "On track this week"
      : "Over budget this week"
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center"
    >
      <span
        className={cn("font-bold tracking-tight font-serif", sizeClasses)}
        style={{ color }}
      >
        {label}
      </span>
      {weeklyMessage && (
        <span
          className={cn("text-muted-foreground mt-1", subTextClasses)}
          style={{
            color: weeklyBalance && !isOnTrack(weeklyBalance) ? "var(--destructive)" : undefined,
          }}
        >
          {weeklyMessage}
        </span>
      )}
      <span className="text-[10px] text-muted-foreground/60 mt-2">
        Tap for details
      </span>
    </motion.div>
  );
}

function ExactView({
  consumed,
  goal,
  weeklyConsumed,
  weeklyBudget,
  energyUnit,
  sizeClasses,
  subTextClasses,
}: {
  consumed: number;
  goal: number;
  weeklyConsumed?: number;
  weeklyBudget?: number;
  energyUnit: "KCAL" | "KJ";
  sizeClasses: string;
  subTextClasses: string;
}) {
  const displayValue = convertEnergy(consumed, energyUnit);
  const displayGoal = convertEnergy(goal, energyUnit);
  const label = getEnergyLabel(energyUnit);

  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal ? consumed - goal : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center"
    >
      <span className={cn("font-bold tracking-tight font-serif", sizeClasses)}>
        {displayValue}
      </span>
      <span className={cn("text-muted-foreground", subTextClasses)}>
        of {displayGoal} {label}
      </span>

      {/* Daily status badge */}
      <div className="mt-2">
        {over > 0 ? (
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            +{convertEnergy(over, energyUnit)} {label} over
          </span>
        ) : (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
            {convertEnergy(remaining, energyUnit)} {label} remaining
          </span>
        )}
      </div>

      {/* Weekly context */}
      {weeklyBudget && weeklyConsumed !== undefined && (
        <div className="mt-2 text-xs text-muted-foreground">
          Weekly: {convertEnergy(weeklyConsumed, energyUnit).toLocaleString()} /{" "}
          {convertEnergy(weeklyBudget, energyUnit).toLocaleString()} {label}
        </div>
      )}

      <span className="text-[10px] text-muted-foreground/60 mt-2">
        Tap for simple view
      </span>
    </motion.div>
  );
}
