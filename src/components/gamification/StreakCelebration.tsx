"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STREAK_MILESTONES } from "@/lib/gamification/streaks";

interface StreakCelebrationProps {
  milestone: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const milestoneConfig: Record<
  number,
  { icon: typeof Flame; title: string; message: string; colors: string[] }
> = {
  7: {
    icon: Flame,
    title: "Week Warrior!",
    message: "You've logged food for 7 days straight. Keep it up!",
    colors: ["#f97316", "#ea580c"],
  },
  14: {
    icon: Star,
    title: "Fortnight Fighter!",
    message: "Two weeks of consistency. You're building great habits!",
    colors: ["#eab308", "#f97316"],
  },
  30: {
    icon: Trophy,
    title: "Monthly Master!",
    message: "A full month! You're officially in the habit zone.",
    colors: ["#22c55e", "#16a34a"],
  },
  60: {
    icon: Star,
    title: "60-Day Sage!",
    message: "Two months of dedication. You're unstoppable!",
    colors: ["#3b82f6", "#2563eb"],
  },
  90: {
    icon: Trophy,
    title: "Quarter Champion!",
    message: "90 days! This is a lifestyle now.",
    colors: ["#8b5cf6", "#7c3aed"],
  },
  180: {
    icon: Sparkles,
    title: "Half-Year Hero!",
    message: "Six months of consistency. Truly legendary!",
    colors: ["#ec4899", "#db2777"],
  },
  365: {
    icon: Sparkles,
    title: "Year Legend!",
    message: "One full year! You've achieved something incredible.",
    colors: ["#f59e0b", "#d97706", "#dc2626"],
  },
};

export function StreakCelebration({
  milestone,
  open,
  onOpenChange,
}: StreakCelebrationProps) {
  const config = milestoneConfig[milestone] || {
    icon: Flame,
    title: `${milestone}-Day Streak!`,
    message: "Amazing achievement!",
    colors: ["#f97316", "#ea580c"],
  };

  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Streak Milestone Reached</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 px-4">
          {/* Confetti-like particles */}
          <AnimatePresence>
            {open && (
              <>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: config.colors[i % config.colors.length],
                      left: `${20 + Math.random() * 60}%`,
                      top: "50%",
                    }}
                    initial={{ opacity: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [-100, -200 - Math.random() * 100],
                      x: (Math.random() - 0.5) * 200,
                      scale: [0, 1, 0.5],
                      rotate: Math.random() * 360,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.05,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Main icon with glow */}
          <motion.div
            className="relative mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="absolute inset-0 blur-xl rounded-full"
              style={{
                background: `radial-gradient(circle, ${config.colors[0]}60 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${config.colors.join(", ")})`,
              }}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Milestone number */}
          <motion.div
            className="text-5xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${config.colors.join(", ")})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {milestone}
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-xl font-semibold mb-2 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {config.title}
          </motion.h2>

          {/* Message */}
          <motion.p
            className="text-sm text-muted-foreground text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {config.message}
          </motion.p>

          {/* Next milestone hint */}
          {STREAK_MILESTONES.includes(milestone as (typeof STREAK_MILESTONES)[number]) && (
            <motion.p
              className="text-xs text-muted-foreground mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Next milestone:{" "}
              {STREAK_MILESTONES.find((m) => m > milestone) || "You've reached the top!"}
              {STREAK_MILESTONES.find((m) => m > milestone) && " days"}
            </motion.p>
          )}

          {/* Close button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={() => onOpenChange(false)} className="min-w-[120px]">
              Keep Going!
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
