"use client";

import { motion } from "framer-motion";
import { BADGES, BadgeCategory, BadgeDefinition } from "@/lib/gamification/badges";
import { cn } from "@/lib/utils";
import {
  Flame,
  Heart,
  Target,
  Users,
  Utensils,
  Calendar,
  Star,
  Trophy,
  Crown,
  Medal,
  CheckCircle,
  PieChart,
  Zap,
  Award,
  Compass,
  Scan,
  Sun,
  Bell,
  Gift,
  ListChecks,
  Lock,
  LucideIcon,
} from "lucide-react";

interface Achievement {
  badgeId: string;
  unlockedAt: Date;
}

interface JointBadgeConstellationProps {
  userAchievements: Achievement[];
  partnerAchievements: Achievement[];
  partnerName: string;
}

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  flame: Flame,
  fire: Flame,
  calendar: Calendar,
  star: Star,
  trophy: Trophy,
  crown: Crown,
  medal: Medal,
  heart: Heart,
  users: Users,
  zap: Zap,
  target: Target,
  "check-circle": CheckCircle,
  "pie-chart": PieChart,
  award: Award,
  compass: Compass,
  scan: Scan,
  sun: Sun,
  bell: Bell,
  gift: Gift,
  "list-check": ListChecks,
};

const rarityColors: Record<string, string> = {
  common: "from-slate-400 to-slate-500",
  uncommon: "from-emerald-400 to-emerald-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

const rarityBorderColors: Record<string, string> = {
  common: "border-slate-400/50",
  uncommon: "border-emerald-400/50",
  rare: "border-blue-400/50",
  epic: "border-purple-400/50",
  legendary: "border-amber-400/50",
};

export function JointBadgeConstellation({
  userAchievements,
  partnerAchievements,
  partnerName,
}: JointBadgeConstellationProps) {
  const userBadgeIds = new Set(userAchievements.map((a) => a.badgeId));
  const partnerBadgeIds = new Set(partnerAchievements.map((a) => a.badgeId));

  // Get shared badges (both have)
  const sharedBadges = Object.values(BADGES).filter(
    (badge) => userBadgeIds.has(badge.id) && partnerBadgeIds.has(badge.id)
  );

  // Get user-only badges
  const userOnlyBadges = Object.values(BADGES).filter(
    (badge) => userBadgeIds.has(badge.id) && !partnerBadgeIds.has(badge.id)
  );

  // Get partner-only badges
  const partnerOnlyBadges = Object.values(BADGES).filter(
    (badge) => partnerBadgeIds.has(badge.id) && !userBadgeIds.has(badge.id)
  );

  // Stats
  const totalBadges = Object.keys(BADGES).length;
  const userCount = userAchievements.length;
  const partnerCount = partnerAchievements.length;
  const sharedCount = sharedBadges.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center p-3 rounded-xl bg-[var(--you-bg)] border border-[var(--you-color)]/30">
          <div className="text-2xl font-bold text-[var(--you-color)]">
            {userCount}
          </div>
          <div className="text-xs text-muted-foreground">Your Badges</div>
        </div>
        <div className="text-center p-3 rounded-xl together-gradient-subtle border border-primary/30">
          <div className="text-2xl font-bold together-gradient bg-clip-text text-transparent">
            {sharedCount}
          </div>
          <div className="text-xs text-muted-foreground">Shared</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[var(--partner-bg)] border border-[var(--partner-color)]/30">
          <div className="text-2xl font-bold text-[var(--partner-color)]">
            {partnerCount}
          </div>
          <div className="text-xs text-muted-foreground">{partnerName.split(" ")[0]}</div>
        </div>
      </motion.div>

      {/* Shared Badges Section */}
      {sharedBadges.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <h3 className="text-sm font-semibold">Earned Together</h3>
            <span className="text-xs text-muted-foreground">
              ({sharedBadges.length})
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sharedBadges.map((badge, i) => (
              <SharedBadgeItem key={badge.id} badge={badge} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* User Column */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--you-color)]" />
            <h3 className="text-sm font-semibold">Only You</h3>
            <span className="text-xs text-muted-foreground">
              ({userOnlyBadges.length})
            </span>
          </div>
          <div className="space-y-2">
            {userOnlyBadges.length > 0 ? (
              userOnlyBadges.map((badge, i) => (
                <BadgeRow
                  key={badge.id}
                  badge={badge}
                  index={i}
                  variant="user"
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                All your badges are shared!
              </p>
            )}
          </div>
        </motion.div>

        {/* Partner Column */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--partner-color)]" />
            <h3 className="text-sm font-semibold">Only {partnerName.split(" ")[0]}</h3>
            <span className="text-xs text-muted-foreground">
              ({partnerOnlyBadges.length})
            </span>
          </div>
          <div className="space-y-2">
            {partnerOnlyBadges.length > 0 ? (
              partnerOnlyBadges.map((badge, i) => (
                <BadgeRow
                  key={badge.id}
                  badge={badge}
                  index={i}
                  variant="partner"
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Catch up with your partner!
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Progress Footer */}
      <motion.div
        className="flex items-center justify-center gap-2 pt-4 border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-xs text-muted-foreground">
          Together you&apos;ve earned{" "}
          <span className="font-semibold text-foreground">
            {new Set([...userBadgeIds, ...partnerBadgeIds]).size}
          </span>{" "}
          of {totalBadges} badges
        </div>
      </motion.div>
    </div>
  );
}

function SharedBadgeItem({
  badge,
  index,
}: {
  badge: BadgeDefinition;
  index: number;
}) {
  const Icon = iconMap[badge.icon] || Star;

  return (
    <motion.div
      className={cn(
        "aspect-square rounded-xl flex flex-col items-center justify-center p-2",
        "bg-gradient-to-br together-gradient-subtle",
        "border-2 border-primary/30",
        "relative overflow-hidden"
      )}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.1 + index * 0.05, type: "spring" }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          opacity: [0, 0.5, 0],
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          delay: index * 0.2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      />

      <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", rarityColors[badge.rarity])}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-[10px] font-medium text-center mt-1 line-clamp-1">
        {badge.name.split(" ")[0]}
      </span>
    </motion.div>
  );
}

function BadgeRow({
  badge,
  index,
  variant,
}: {
  badge: BadgeDefinition;
  index: number;
  variant: "user" | "partner";
}) {
  const Icon = iconMap[badge.icon] || Star;
  const accentColor = variant === "user" ? "var(--you-color)" : "var(--partner-color)";

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg",
        variant === "user" ? "bg-[var(--you-bg)]" : "bg-[var(--partner-bg)]",
        variant === "user"
          ? "border border-[var(--you-color)]/20"
          : "border border-[var(--partner-color)]/20"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <div
        className={cn("p-1.5 rounded-lg bg-gradient-to-br", rarityColors[badge.rarity])}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{badge.name}</div>
        <div className="text-[10px] text-muted-foreground capitalize">
          {badge.rarity}
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for profile page
export function JointBadgePreview({
  userCount,
  partnerCount,
  sharedCount,
  partnerName,
  onClick,
}: {
  userCount: number;
  partnerCount: number;
  sharedCount: number;
  partnerName: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      className="w-full p-4 rounded-xl together-gradient-subtle border border-primary/20 text-left hover:border-primary/40 transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-semibold">Joint Achievements</span>
        </div>
        <span className="text-xs text-muted-foreground">Tap to view</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--you-color)]" />
          <span className="text-xs">{userCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium">{sharedCount} shared</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--partner-color)]" />
          <span className="text-xs">{partnerCount}</span>
        </div>
      </div>
    </motion.button>
  );
}
