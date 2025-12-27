"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

type DuoFlameSize = "none" | "duo-small" | "duo-medium" | "duo-large" | "duo-epic";

interface DuoFlameProps {
  userStreak: number;
  partnerStreak: number;
  size?: number;
}

const duoFlameSizeConfig: Record<
  DuoFlameSize,
  { scale: number; glowIntensity: number; colors: string[] }
> = {
  none: {
    scale: 0.9,
    glowIntensity: 0,
    colors: ["#94a3b8", "#64748b"],
  },
  "duo-small": {
    scale: 1.1,
    glowIntensity: 0.4,
    colors: ["#c9553d", "#4d8b6f"], // terracotta to sage
  },
  "duo-medium": {
    scale: 1.3,
    glowIntensity: 0.6,
    colors: ["#c9553d", "#dc7a3d", "#4d8b6f"], // terracotta, orange, sage
  },
  "duo-large": {
    scale: 1.5,
    glowIntensity: 0.8,
    colors: ["#c9553d", "#f97316", "#22c55e", "#4d8b6f"], // terracotta, orange, green, sage
  },
  "duo-epic": {
    scale: 1.7,
    glowIntensity: 1,
    colors: ["#a855f7", "#c9553d", "#22c55e", "#4d8b6f"], // purple, terracotta, green, sage
  },
};

function getDuoFlameSize(userStreak: number, partnerStreak: number): DuoFlameSize {
  const combined = Math.min(userStreak, partnerStreak);
  if (combined === 0) return "none";
  if (combined < 7) return "duo-small";
  if (combined < 30) return "duo-medium";
  if (combined < 90) return "duo-large";
  return "duo-epic";
}

export function DuoFlame({ userStreak, partnerStreak, size = 56 }: DuoFlameProps) {
  const duoSize = getDuoFlameSize(userStreak, partnerStreak);
  const config = duoFlameSizeConfig[duoSize];
  const hasDuoStreak = userStreak > 0 && partnerStreak > 0;
  const combinedStreak = Math.min(userStreak, partnerStreak);

  const gradientId = `duo-flame-gradient-${duoSize}`;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Outer glow effect */}
        {config.glowIntensity > 0 && hasDuoStreak && (
          <motion.div
            className="absolute inset-0 blur-lg rounded-full"
            style={{
              background: `radial-gradient(circle, ${config.colors[0]}50 0%, ${config.colors[config.colors.length - 1]}30 50%, transparent 70%)`,
              transform: `scale(${1.8 + config.glowIntensity * 0.4})`,
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1.8, 2.1, 1.8],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Flame container with dance animation */}
        <motion.div
          className={hasDuoStreak ? "animate-duo-flame" : ""}
          style={{ transformOrigin: "bottom center" }}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
                {config.colors.map((color, i) => (
                  <stop
                    key={i}
                    offset={`${(i / (config.colors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>

              {/* Shimmer effect for epic flames */}
              {duoSize === "duo-epic" && (
                <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0">
                    <animate
                      attributeName="offset"
                      values="-1;2"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="50%" stopColor="white" stopOpacity="0.3">
                    <animate
                      attributeName="offset"
                      values="-0.5;2.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="white" stopOpacity="0">
                    <animate
                      attributeName="offset"
                      values="0;3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              )}
            </defs>

            {/* Main flame */}
            <Flame
              className="w-full h-full"
              style={{
                fill: hasDuoStreak ? `url(#${gradientId})` : "none",
                stroke: hasDuoStreak ? "none" : config.colors[0],
                strokeWidth: hasDuoStreak ? 0 : 1.5,
                transform: `scale(${config.scale})`,
                transformOrigin: "center",
              }}
            />

            {/* Shimmer overlay for epic */}
            {duoSize === "duo-epic" && (
              <Flame
                className="w-full h-full absolute inset-0"
                style={{
                  fill: "url(#shimmer-gradient)",
                  transform: `scale(${config.scale})`,
                  transformOrigin: "center",
                  mixBlendMode: "overlay",
                }}
              />
            )}
          </svg>
        </motion.div>

        {/* Spark particles for larger flames */}
        {(duoSize === "duo-large" || duoSize === "duo-epic") && (
          <SparkParticles size={size} intensity={config.glowIntensity} />
        )}
      </motion.div>

      {/* Duo streak count */}
      {hasDuoStreak && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-2xl font-bold tabular-nums together-gradient bg-clip-text text-transparent">
            {combinedStreak}
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            day duo streak
          </span>
        </motion.div>
      )}

      {/* Individual streaks */}
      <motion.div
        className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[var(--you-color)]" />
          <span>You: {userStreak}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[var(--partner-color)]" />
          <span>Partner: {partnerStreak}</span>
        </div>
      </motion.div>
    </div>
  );
}

function SparkParticles({ size, intensity }: { size: number; intensity: number }) {
  const particles = Array.from({ length: Math.floor(3 + intensity * 3) }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * size * 0.6,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random(),
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: "50%",
            bottom: "30%",
            background: `linear-gradient(135deg, var(--you-color), var(--partner-color))`,
          }}
          animate={{
            x: [0, particle.x],
            y: [0, -size * 0.5],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Compact version for dashboard header
export function DuoFlameCompact({
  userStreak,
  partnerStreak,
}: {
  userStreak: number;
  partnerStreak: number;
}) {
  const hasDuoStreak = userStreak > 0 && partnerStreak > 0;
  const combinedStreak = Math.min(userStreak, partnerStreak);
  const duoSize = getDuoFlameSize(userStreak, partnerStreak);
  const config = duoFlameSizeConfig[duoSize];

  const gradientId = `duo-flame-compact-${duoSize}`;

  if (!hasDuoStreak) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        className="relative"
        animate={
          hasDuoStreak
            ? {
                scale: [1, 1.1, 1],
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
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
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
              fill: `url(#${gradientId})`,
            }}
          />
        </svg>
      </motion.div>
      <span className="font-semibold text-sm tabular-nums">
        {combinedStreak}
      </span>
    </div>
  );
}
