"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EnergyValue } from "@/components/ui/energy-value";
import { Heart } from "lucide-react";

interface PartnerCardProps {
  partnerName: string;
  partnerImage?: string | null;
  totalCalories: number;
  calorieGoal: number;
}

export function PartnerCard({
  partnerName,
  partnerImage,
  totalCalories,
  calorieGoal,
}: PartnerCardProps) {
  const progress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const isOnTrack = totalCalories <= calorieGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl p-4 border border-secondary/50"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-secondary">
          <AvatarImage src={partnerImage || undefined} />
          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
            {partnerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-primary fill-primary" />
            <span className="font-semibold text-sm truncate">
              {partnerName}&apos;s Progress
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {isOnTrack ? (
          <span className="text-success">On track today!</span>
        ) : (
          <span>
            <EnergyValue kcal={totalCalories - calorieGoal} /> over goal
          </span>
        )}
      </p>
    </motion.div>
  );
}
