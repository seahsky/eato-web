"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Heart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDisplayMode } from "@/contexts/display-mode-context";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel } from "@/lib/energy";
import {
  getEnergyBalance,
  getEnergyBalanceLabel,
  getEnergyBalanceColor,
  isOnTrack,
  type EnergyBalanceLevel,
} from "@/lib/energy-balance";

interface PartnerCardProps {
  partnerName: string;
  partnerImage?: string | null;
  totalCalories: number;
  calorieGoal: number;
  userCalories?: number;
  userGoal?: number;
  partnerLoggedToday?: boolean;
  // Weekly data
  partnerWeeklyConsumed?: number;
  partnerWeeklyBudget?: number;
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
  partnerWeeklyConsumed,
  partnerWeeklyBudget,
  onClick,
}: PartnerCardProps) {
  const { isQualitative, toggleDisplayMode } = useDisplayMode();
  const { energyUnit } = useEnergyUnit();

  const partnerProgress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const userProgress =
    userCalories && userGoal
      ? Math.min((userCalories / userGoal) * 100, 100)
      : null;

  const partnerDailyBalance = getEnergyBalance(totalCalories, calorieGoal);
  const userDailyBalance =
    userCalories && userGoal
      ? getEnergyBalance(userCalories, userGoal)
      : null;

  const partnerWeeklyBalance = partnerWeeklyBudget
    ? getEnergyBalance(partnerWeeklyConsumed ?? 0, partnerWeeklyBudget)
    : null;

  const partnerOnTrack = isOnTrack(partnerDailyBalance);
  const userOnTrack = userDailyBalance ? isOnTrack(userDailyBalance) : true;
  const bothOnTrack = partnerOnTrack && userOnTrack;

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
              <motion.div className={cn(bothOnTrack && "animate-heartbeat")}>
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

            {/* Progress display - toggleable between qualitative and exact */}
            <div
              className="mt-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleDisplayMode();
              }}
            >
              {isQualitative ? (
                <QualitativeProgress
                  partnerBalance={partnerDailyBalance}
                  userBalance={userDailyBalance}
                  partnerName={partnerName}
                  partnerWeeklyBalance={partnerWeeklyBalance}
                />
              ) : (
                <ExactProgress
                  partnerProgress={partnerProgress}
                  userProgress={userProgress}
                  partnerName={partnerName}
                  totalCalories={totalCalories}
                  calorieGoal={calorieGoal}
                  energyUnit={energyUnit}
                />
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          {bothOnTrack ? (
            <span className="text-success font-medium">Both on track today!</span>
          ) : partnerOnTrack ? (
            <span className="text-success">Partner on track!</span>
          ) : (
            <span>
              {convertEnergy(totalCalories - calorieGoal, energyUnit)}{" "}
              {getEnergyLabel(energyUnit)} over goal
            </span>
          )}
        </p>
      </div>
    </motion.button>
  );
}

function QualitativeProgress({
  partnerBalance,
  userBalance,
  partnerName,
  partnerWeeklyBalance,
}: {
  partnerBalance: EnergyBalanceLevel;
  userBalance: EnergyBalanceLevel | null;
  partnerName: string;
  partnerWeeklyBalance: EnergyBalanceLevel | null;
}) {
  return (
    <div className="space-y-1.5">
      {userBalance && (
        <div className="flex items-center gap-2">
          <div className="w-8 text-xs text-muted-foreground">You</div>
          <span
            className="text-xs font-semibold"
            style={{ color: getEnergyBalanceColor(userBalance) }}
          >
            {getEnergyBalanceLabel(userBalance)}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="w-8 text-xs text-muted-foreground truncate">
          {partnerName.split(" ")[0]}
        </div>
        <span
          className="text-xs font-semibold"
          style={{ color: getEnergyBalanceColor(partnerBalance) }}
        >
          {getEnergyBalanceLabel(partnerBalance)}
        </span>
        {partnerWeeklyBalance && (
          <span className="text-[10px] text-muted-foreground">
            · {isOnTrack(partnerWeeklyBalance) ? "On track this week" : "Over budget"}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
        Tap for details
      </p>
    </div>
  );
}

function ExactProgress({
  partnerProgress,
  userProgress,
  partnerName,
  totalCalories,
  calorieGoal,
  energyUnit,
}: {
  partnerProgress: number;
  userProgress: number | null;
  partnerName: string;
  totalCalories: number;
  calorieGoal: number;
  energyUnit: "KCAL" | "KJ";
}) {
  return (
    <div className="space-y-1.5">
      {userProgress !== null && (
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
      )}
      <div className="flex items-center gap-2">
        <div className="w-8 text-xs text-muted-foreground truncate">
          {partnerName.split(" ")[0]}
        </div>
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
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {convertEnergy(totalCalories, energyUnit)} / {convertEnergy(calorieGoal, energyUnit)}{" "}
        {getEnergyLabel(energyUnit)}
      </p>
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Tap for simple view
      </p>
    </div>
  );
}
