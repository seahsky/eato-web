"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Utensils,
  Target,
  Flame,
  Trophy,
  BookOpen,
  Copy,
  PartyPopper,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EnergyValue } from "@/components/ui/energy-value";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";

type ActivityType = "food_logged" | "daily_goal_hit" | "streak_milestone" | "badge_earned" | "recipe_created";

interface FeedItemProps {
  item: {
    id: string;
    type: ActivityType;
    timestamp: Date;
    data: Record<string, unknown>;
  };
  partnerName: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800",
  uncommon: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900",
  rare: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900",
  epic: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900",
  legendary: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900",
};

export function FeedItem({ item, partnerName }: FeedItemProps) {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
  const [isCopying, setIsCopying] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const utils = trpc.useUtils();

  const copyFoodMutation = trpc.food.copyPartnerFood.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data.foodName}" copied to your log!`);
      utils.stats.getDailySummary.invalidate();
      utils.food.getByDate.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to copy food");
    },
    onSettled: () => {
      setIsCopying(false);
    },
  });

  const celebrateMutation = trpc.auth.sendCelebration.useMutation({
    onSuccess: (data) => {
      if (data.sent) {
        toast.success(`Celebration sent to ${partnerName}!`);
      } else {
        toast.success("Celebration sent! (Partner may have notifications disabled)");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send celebration");
    },
    onSettled: () => {
      setIsCelebrating(false);
    },
  });

  const handleCopyFood = (entryId: string) => {
    setIsCopying(true);
    copyFoodMutation.mutate({ entryId });
  };

  const handleCelebrate = (reason: "goal_hit" | "streak_milestone" | "badge_earned" | "general") => {
    setIsCelebrating(true);
    celebrateMutation.mutate({ reason });
  };

  const renderContent = () => {
    switch (item.type) {
      case "food_logged": {
        const { entryId, foodName, calories, mealType } = item.data as {
          entryId: string;
          foodName: string;
          calories: number;
          mealType: string;
        };
        return (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{partnerName}</span> logged{" "}
                <span className="font-medium">{foodName}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <EnergyValue kcal={calories} className="text-xs text-muted-foreground" />
                <span className="text-xs text-muted-foreground">&middot;</span>
                <span className="text-xs text-muted-foreground capitalize">{mealType.toLowerCase()}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-8 w-8 p-0"
              onClick={() => handleCopyFood(entryId)}
              disabled={isCopying}
            >
              {isCopying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        );
      }

      case "daily_goal_hit": {
        const { calories, goal } = item.data as {
          calories: number;
          goal: number;
        };
        return (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{partnerName}</span> hit their daily goal!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <EnergyValue kcal={calories} className="inline" /> of{" "}
                <EnergyValue kcal={goal} className="inline" />
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-8 w-8 p-0"
              onClick={() => handleCelebrate("goal_hit")}
              disabled={isCelebrating}
            >
              {isCelebrating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PartyPopper className="w-4 h-4 text-amber-500" />
              )}
            </Button>
          </div>
        );
      }

      case "streak_milestone": {
        const { milestone, flameSize } = item.data as {
          milestone: number;
          flameSize: string;
        };
        return (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{partnerName}</span> reached a{" "}
                <span className="font-medium">{milestone}-day streak!</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {flameSize} flame unlocked
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-8 w-8 p-0"
              onClick={() => handleCelebrate("streak_milestone")}
              disabled={isCelebrating}
            >
              {isCelebrating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PartyPopper className="w-4 h-4 text-amber-500" />
              )}
            </Button>
          </div>
        );
      }

      case "badge_earned": {
        const { badgeName, badgeIcon, rarity } = item.data as {
          badgeName: string;
          badgeIcon: string;
          rarity: string;
        };
        return (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{partnerName}</span> earned a badge!
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{badgeIcon}</span>
                <span className="text-xs font-medium">{badgeName}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                  RARITY_COLORS[rarity] || RARITY_COLORS.common
                )}>
                  {rarity}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-8 w-8 p-0"
              onClick={() => handleCelebrate("badge_earned")}
              disabled={isCelebrating}
            >
              {isCelebrating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PartyPopper className="w-4 h-4 text-amber-500" />
              )}
            </Button>
          </div>
        );
      }

      case "recipe_created": {
        const { recipeName, yieldWeight, yieldUnit } = item.data as {
          recipeName: string;
          yieldWeight: number;
          yieldUnit: string;
        };
        return (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{partnerName}</span> created a recipe
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {recipeName} ({yieldWeight} {yieldUnit})
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-card rounded-xl border border-border/50"
    >
      {renderContent()}
      <p className="text-[10px] text-muted-foreground mt-2 ml-[52px]">
        {timeAgo}
      </p>
    </motion.div>
  );
}
