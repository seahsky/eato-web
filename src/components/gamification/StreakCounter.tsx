"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

type FlameSize = "none" | "small" | "medium" | "large" | "epic";

interface StreakCounterProps {
  currentStreak: number;
  flameSize: FlameSize;
  streakFreezes: number;
  nextMilestone: number | null;
  milestoneProgress: number;
  streakAtRisk?: boolean;
  compact?: boolean;
  className?: string;
}

const flameSizeConfig: Record<
  FlameSize,
  { scale: number; glowIntensity: number; colors: string[] }
> = {
  none: { scale: 0.8, glowIntensity: 0, colors: ["#94a3b8", "#64748b"] },
  small: { scale: 1, glowIntensity: 0.3, colors: ["#f97316", "#ea580c"] },
  medium: { scale: 1.2, glowIntensity: 0.5, colors: ["#f97316", "#dc2626"] },
  large: { scale: 1.4, glowIntensity: 0.7, colors: ["#eab308", "#f97316", "#dc2626"] },
  epic: { scale: 1.6, glowIntensity: 1, colors: ["#a855f7", "#ec4899", "#f97316"] },
};

export function StreakCounter({
  currentStreak,
  flameSize,
  streakFreezes,
  nextMilestone,
  milestoneProgress,
  streakAtRisk = false,
  compact = false,
  className,
}: StreakCounterProps) {
  const config = flameSizeConfig[flameSize];
  const hasStreak = currentStreak > 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <FlameIcon
          flameSize={flameSize}
          config={config}
          hasStreak={hasStreak}
          streakAtRisk={streakAtRisk}
          size={20}
        />
        <span className="font-semibold text-sm tabular-nums">
          {currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Flame icon with glow effect */}
      <div className="relative">
        <FlameIcon
          flameSize={flameSize}
          config={config}
          hasStreak={hasStreak}
          streakAtRisk={streakAtRisk}
          size={48}
        />
      </div>

      {/* Streak count */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-3xl font-bold tabular-nums">{currentStreak}</span>
        <span className="text-sm text-muted-foreground ml-1">
          day{currentStreak !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Progress to next milestone */}
      {nextMilestone && hasStreak && (
        <motion.div
          className="mt-3 w-full max-w-[120px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentStreak}</span>
            <span>{nextMilestone}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${config.colors.join(", ")})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${milestoneProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Streak freezes */}
      {streakFreezes > 0 && (
        <motion.div
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Snowflake className="w-3 h-3 text-blue-400" />
          <span>{streakFreezes} freeze{streakFreezes !== 1 ? "s" : ""}</span>
        </motion.div>
      )}

      {/* Streak at risk warning */}
      <AnimatePresence>
        {streakAtRisk && (
          <motion.div
            className="mt-3 text-xs text-amber-500 font-medium"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            Log food to keep your streak!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlameIcon({
  flameSize,
  config,
  hasStreak,
  streakAtRisk,
  size,
}: {
  flameSize: FlameSize;
  config: typeof flameSizeConfig[FlameSize];
  hasStreak: boolean;
  streakAtRisk: boolean;
  size: number;
}) {
  const gradientId = `flame-gradient-${flameSize}`;

  return (
    <motion.div
      className="relative"
      animate={
        streakAtRisk
          ? {
              x: [-2, 2, -2, 2, 0],
              transition: { duration: 0.4, repeat: Infinity, repeatDelay: 2 },
            }
          : {}
      }
    >
      {/* Glow effect */}
      {config.glowIntensity > 0 && (
        <motion.div
          className="absolute inset-0 blur-md rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.colors[0]}40 0%, transparent 70%)`,
            transform: `scale(${1.5 + config.glowIntensity * 0.5})`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1.5, 1.7, 1.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <motion.div
        animate={
          hasStreak
            ? {
                scale: [1, 1.05, 1],
                rotate: [-2, 2, -2],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
              {config.colors.map((color, i) => (
                <stop
                  key={i}
                  offset={`${(i / (config.colors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>
          <Flame
            className="w-full h-full"
            style={{
              fill: hasStreak ? `url(#${gradientId})` : "none",
              stroke: hasStreak ? "none" : config.colors[0],
              strokeWidth: hasStreak ? 0 : 1.5,
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
