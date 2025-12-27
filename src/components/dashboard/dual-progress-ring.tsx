"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Heart } from "lucide-react";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel } from "@/lib/energy";
import { cn } from "@/lib/utils";

interface DualProgressRingProps {
  userProgress: { current: number; goal: number };
  partnerProgress?: { current: number; goal: number; name: string };
  size?: number;
  strokeWidth?: number;
}

export function DualProgressRing({
  userProgress,
  partnerProgress,
  size = 220,
  strokeWidth = 10,
}: DualProgressRingProps) {
  const hasPartner = !!partnerProgress;

  // User ring calculations (outer ring)
  const userRing = useMemo(() => {
    const pct = Math.min((userProgress.current / userProgress.goal) * 100, 150);
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const offs = circ - (Math.min(pct, 100) / 100) * circ;

    return {
      percentage: pct,
      circumference: circ,
      offset: offs,
      radius,
      isOnTrack: pct <= 100,
    };
  }, [userProgress, size, strokeWidth]);

  // Partner ring calculations (inner ring, slightly smaller)
  const partnerRing = useMemo(() => {
    if (!partnerProgress) return null;

    const pct = Math.min(
      (partnerProgress.current / partnerProgress.goal) * 100,
      150
    );
    const radius = (size - strokeWidth) / 2 - strokeWidth - 8;
    const circ = 2 * Math.PI * radius;
    const offs = circ - (Math.min(pct, 100) / 100) * circ;

    return {
      percentage: pct,
      circumference: circ,
      offset: offs,
      radius,
      isOnTrack: pct <= 100,
    };
  }, [partnerProgress, size, strokeWidth]);

  const bothOnTrack = userRing.isOnTrack && (partnerRing?.isOnTrack ?? true);
  const userRemaining = Math.max(userProgress.goal - userProgress.current, 0);
  const userOver =
    userProgress.current > userProgress.goal
      ? userProgress.current - userProgress.goal
      : 0;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute transform -rotate-90"
        width={size}
        height={size}
      >
        <defs>
          {/* User ring gradient (terracotta) */}
          <linearGradient id="user-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--you-color)" />
            <stop offset="100%" stopColor="oklch(0.5 0.14 30)" />
          </linearGradient>

          {/* Partner ring gradient (sage) */}
          <linearGradient id="partner-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--partner-color)" />
            <stop offset="100%" stopColor="oklch(0.5 0.12 145)" />
          </linearGradient>

          {/* Glow filter for rings */}
          <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* User background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={userRing.radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />

        {/* User progress ring (outer - terracotta) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={userRing.radius}
          fill="none"
          stroke={userRing.isOnTrack ? "url(#user-ring-gradient)" : "var(--destructive)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={userRing.circumference}
          initial={{ strokeDashoffset: userRing.circumference }}
          animate={{ strokeDashoffset: userRing.offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          filter="url(#ring-glow)"
        />

        {/* Partner rings (only if partner exists) */}
        {partnerRing && (
          <>
            {/* Partner background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={partnerRing.radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={strokeWidth - 2}
              className="opacity-20"
            />

            {/* Partner progress ring (inner - sage) */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={partnerRing.radius}
              fill="none"
              stroke={partnerRing.isOnTrack ? "url(#partner-ring-gradient)" : "var(--destructive)"}
              strokeWidth={strokeWidth - 2}
              strokeLinecap="round"
              strokeDasharray={partnerRing.circumference}
              initial={{ strokeDashoffset: partnerRing.circumference }}
              animate={{ strokeDashoffset: partnerRing.offset }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              filter="url(#ring-glow)"
            />
          </>
        )}
      </svg>

      {/* Center content */}
      <div className="text-center z-10 flex flex-col items-center">
        {/* Heart icon for partner mode */}
        {hasPartner && (
          <motion.div
            className={cn(
              "mb-1",
              bothOnTrack && "animate-heartbeat"
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors duration-500",
                bothOnTrack
                  ? "text-primary fill-primary"
                  : "text-muted-foreground fill-muted-foreground/30"
              )}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <EnergyValue
            kcal={userProgress.current}
            showUnit={false}
            toggleable
            className="text-4xl font-bold tracking-tight font-serif"
          />
        </motion.div>

        <CenterStatus
          userProgress={userProgress}
          partnerProgress={partnerProgress}
          userRemaining={userRemaining}
          userOver={userOver}
          bothOnTrack={bothOnTrack}
        />
      </div>

      {/* Partner indicator labels (positioned at ring edges) */}
      {hasPartner && partnerProgress && (
        <PartnerLabels
          size={size}
          userPercentage={userRing.percentage}
          partnerPercentage={partnerRing?.percentage ?? 0}
          partnerName={partnerProgress.name}
        />
      )}
    </div>
  );
}

function CenterStatus({
  userProgress,
  partnerProgress,
  userRemaining,
  userOver,
  bothOnTrack,
}: {
  userProgress: { current: number; goal: number };
  partnerProgress?: { current: number; goal: number; name: string };
  userRemaining: number;
  userOver: number;
  bothOnTrack: boolean;
}) {
  const { energyUnit } = useEnergyUnit();
  const hasPartner = !!partnerProgress;

  return (
    <motion.div
      className="mt-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <p className="text-xs text-muted-foreground">
        of {convertEnergy(userProgress.goal, energyUnit)} {getEnergyLabel(energyUnit)}
      </p>

      <motion.div
        className="mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {userOver > 0 ? (
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            +{convertEnergy(userOver, energyUnit)} {getEnergyLabel(energyUnit)} over
          </span>
        ) : (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
            {convertEnergy(userRemaining, energyUnit)} {getEnergyLabel(energyUnit)} left
          </span>
        )}
      </motion.div>

      {/* Partner sync status */}
      {hasPartner && (
        <motion.p
          className={cn(
            "text-xs mt-2 font-medium",
            bothOnTrack ? "text-success" : "text-muted-foreground"
          )}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {bothOnTrack ? "Both on track!" : "Keep going together"}
        </motion.p>
      )}
    </motion.div>
  );
}

function PartnerLabels({
  size,
  userPercentage,
  partnerPercentage,
  partnerName,
}: {
  size: number;
  userPercentage: number;
  partnerPercentage: number;
  partnerName: string;
}) {
  return (
    <>
      {/* You label (bottom left) */}
      <motion.div
        className="absolute bottom-0 left-0 flex items-center gap-1.5"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="w-2 h-2 rounded-full bg-[var(--you-color)]" />
        <span className="text-xs font-medium text-muted-foreground">
          You · {Math.round(Math.min(userPercentage, 100))}%
        </span>
      </motion.div>

      {/* Partner label (bottom right) */}
      <motion.div
        className="absolute bottom-0 right-0 flex items-center gap-1.5"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1 }}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {partnerName.split(" ")[0]} · {Math.round(Math.min(partnerPercentage, 100))}%
        </span>
        <div className="w-2 h-2 rounded-full bg-[var(--partner-color)]" />
      </motion.div>
    </>
  );
}
