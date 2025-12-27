"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EnergyValue } from "@/components/ui/energy-value";
import { Heart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerCardProps {
  partnerName: string;
  partnerImage?: string | null;
  totalCalories: number;
  calorieGoal: number;
  userCalories?: number;
  userGoal?: number;
  partnerLoggedToday?: boolean;
  onClick?: () => void;
}

export function PartnerCard({
  partnerName,
  partnerImage,
  totalCalories,
  calorieGoal,
  userCalories,
  userGoal,
  partnerLoggedToday = false,
  onClick,
}: PartnerCardProps) {
  const partnerProgress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const userProgress = userCalories && userGoal
    ? Math.min((userCalories / userGoal) * 100, 100)
    : null;
  const isOnTrack = totalCalories <= calorieGoal;
  const bothOnTrack = isOnTrack && userCalories !== undefined && userGoal !== undefined && userCalories <= userGoal;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="w-full text-left overflow-hidden rounded-2xl border border-secondary/50 cursor-pointer hover:bg-secondary/20 transition-colors active:scale-[0.99]"
      onClick={onClick}
    >
      {/* Connection ribbon at top */}
      <div className="h-1 partner-ribbon" />

      <div className="bg-gradient-to-br from-secondary/30 to-secondary/10 p-4">
        <div className="flex items-center gap-3">
          {/* Avatar with active indicator */}
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-secondary">
              <AvatarImage src={partnerImage || undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                {partnerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Active status dot */}
            {partnerLoggedToday && (
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.5 }}
              >
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {/* Heartbeat animation when both on track */}
              <motion.div
                className={cn(
                  bothOnTrack && "animate-heartbeat"
                )}
              >
                <Heart
                  className={cn(
                    "w-3.5 h-3.5 transition-colors duration-300",
                    bothOnTrack
                      ? "text-primary fill-primary"
                      : "text-primary/70 fill-primary/50"
                  )}
                />
              </motion.div>
              <span className="font-semibold text-sm truncate">
                {partnerName}&apos;s Progress
              </span>
            </div>

            {/* Dual progress bars when user data available */}
            {userProgress !== null ? (
              <div className="mt-2 space-y-1.5">
                {/* User progress bar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 text-xs text-muted-foreground">You</div>
                  <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "var(--you-color)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${userProgress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                    {Math.round(userProgress)}%
                  </span>
                </div>
                {/* Partner progress bar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 text-xs text-muted-foreground truncate">{partnerName.split(" ")[0]}</div>
                  <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "var(--partner-color)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${partnerProgress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                    {Math.round(partnerProgress)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Progress value={partnerProgress} className="h-1.5 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(partnerProgress)}%
                </span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          {bothOnTrack ? (
            <span className="text-success font-medium">Both on track today!</span>
          ) : isOnTrack ? (
            <span className="text-success">Partner on track!</span>
          ) : (
            <span>
              <EnergyValue kcal={totalCalories - calorieGoal} /> over goal
            </span>
          )}
        </p>
      </div>
    </motion.button>
  );
}
