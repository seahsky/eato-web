"use client";

import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Star,
  Target,
  Users,
  Calendar,
  Award,
  Utensils,
  Compass,
  Scan,
  Sun,
  Heart,
  Bell,
  Gift,
  Zap,
  Crown,
  PieChart,
  CheckCircle,
  Medal,
  ListCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type BadgeCategory } from "@/lib/gamification/badges";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

// Icon mapping for badges
const badgeIcons: Record<string, typeof Flame> = {
  flame: Flame,
  fire: Flame,
  calendar: Calendar,
  star: Star,
  trophy: Trophy,
  crown: Crown,
  medal: Medal,
  award: Award,
  target: Target,
  "check-circle": CheckCircle,
  "pie-chart": PieChart,
  zap: Zap,
  heart: Heart,
  users: Users,
  bell: Bell,
  gift: Gift,
  utensils: Utensils,
  compass: Compass,
  scan: Scan,
  sun: Sun,
  "list-check": ListCheck,
};

const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-600" },
  uncommon: { bg: "bg-green-100", border: "border-green-300", text: "text-green-600" },
  rare: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-600" },
  epic: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-600" },
  legendary: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-600" },
};

const categoryLabels: Record<BadgeCategory, string> = {
  consistency: "Consistency",
  logging: "Logging",
  goals: "Goals",
  partner: "Partner",
};

interface BadgeItemProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: string;
    rarity: string;
    category: BadgeCategory;
    unlocked: boolean;
    unlockedAt?: Date;
  };
}

function BadgeItem({ badge }: BadgeItemProps) {
  const Icon = badgeIcons[badge.icon] || Star;
  const colors = rarityColors[badge.rarity] || rarityColors.common;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          className={cn(
            "relative w-full aspect-square rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-1 transition-all",
            badge.unlocked
              ? `${colors.bg} ${colors.border} hover:scale-105`
              : "bg-muted/30 border-muted grayscale opacity-50"
          )}
          whileHover={{ scale: badge.unlocked ? 1.05 : 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon
            className={cn(
              "w-8 h-8",
              badge.unlocked ? colors.text : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium text-center leading-tight line-clamp-2",
              badge.unlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {badge.name}
          </span>
          {!badge.unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">?</span>
              </div>
            </div>
          )}
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", badge.unlocked ? colors.text : "text-muted-foreground")} />
            {badge.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                badge.unlocked ? `${colors.bg} ${colors.border}` : ""
              )}
            >
              {badge.rarity}
            </Badge>
            <Badge variant="secondary">{categoryLabels[badge.category]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
          <div className="text-xs text-muted-foreground">
            <strong>Requirement:</strong> {badge.requirement}
          </div>
          {badge.unlocked && badge.unlockedAt && (
            <div className="text-xs text-green-600 font-medium">
              Unlocked {formatDistanceToNow(badge.unlockedAt, { addSuffix: true })}
            </div>
          )}
          {!badge.unlocked && (
            <div className="text-xs text-muted-foreground italic">
              Keep going to unlock this badge!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BadgeShowcaseProps {
  badges: BadgeItemProps["badge"][];
  title?: string;
  showProgress?: boolean;
  className?: string;
}

export function BadgeShowcase({
  badges,
  title = "Achievements",
  showProgress = true,
  className,
}: BadgeShowcaseProps) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        {showProgress && (
          <span className="text-xs text-muted-foreground">
            {unlockedCount} / {totalCount}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {badges.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}

interface BadgeShowcaseByCategoryProps {
  badgesByCategory: Record<BadgeCategory, BadgeItemProps["badge"][]>;
  className?: string;
}

export function BadgeShowcaseByCategory({
  badgesByCategory,
  className,
}: BadgeShowcaseByCategoryProps) {
  const categories: BadgeCategory[] = ["consistency", "logging", "goals", "partner"];

  return (
    <div className={cn("space-y-6", className)}>
      {categories.map((category) => {
        const badges = badgesByCategory[category];
        if (!badges || badges.length === 0) return null;

        return (
          <BadgeShowcase
            key={category}
            badges={badges}
            title={categoryLabels[category]}
          />
        );
      })}
    </div>
  );
}
