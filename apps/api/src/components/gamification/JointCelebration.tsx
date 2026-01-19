"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Heart, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useState } from "react";

interface JointCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userImage?: string | null;
  partnerName?: string;
  partnerImage?: string | null;
}

export function JointCelebration({
  open,
  onOpenChange,
  userName = "You",
  userImage,
  partnerName = "Partner",
  partnerImage,
}: JointCelebrationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
        <AnimatePresence>
          {open && (
            <motion.div
              className="relative bg-gradient-to-br from-card via-card to-secondary/20 rounded-3xl p-8 overflow-hidden border border-border/50"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Confetti background */}
              <ConfettiEffect />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Orbiting avatars around trophy */}
                <div className="relative w-40 h-40 mb-6">
                  {/* Center trophy */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <div className="relative">
                      {/* Glow effect */}
                      <motion.div
                        className="absolute inset-0 blur-xl rounded-full together-gradient opacity-50"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <Trophy className="w-16 h-16 text-amber-500 relative z-10" />
                    </div>
                  </motion.div>

                  {/* User avatar (orbiting left) */}
                  <motion.div
                    className="absolute"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      rotate: [0, 360],
                    }}
                    transition={{
                      x: { delay: 0.5, type: "spring" },
                      opacity: { delay: 0.5 },
                      rotate: { delay: 1, duration: 20, repeat: Infinity, ease: "linear" },
                    }}
                    style={{
                      left: "10%",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <Avatar className="h-12 w-12 border-2 border-[var(--you-color)] shadow-lg">
                      <AvatarImage src={userImage || undefined} />
                      <AvatarFallback className="bg-[var(--you-bg)] text-foreground font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  {/* Partner avatar (orbiting right) */}
                  <motion.div
                    className="absolute"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      rotate: [0, -360],
                    }}
                    transition={{
                      x: { delay: 0.6, type: "spring" },
                      opacity: { delay: 0.6 },
                      rotate: { delay: 1, duration: 20, repeat: Infinity, ease: "linear" },
                    }}
                    style={{
                      right: "10%",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <Avatar className="h-12 w-12 border-2 border-[var(--partner-color)] shadow-lg">
                      <AvatarImage src={partnerImage || undefined} />
                      <AvatarFallback className="bg-[var(--partner-bg)] text-foreground font-semibold">
                        {partnerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  {/* Heart connection */}
                  <motion.div
                    className="absolute left-1/2 top-0 -translate-x-1/2"
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    <Heart className="w-6 h-6 text-primary fill-primary animate-heartbeat" />
                  </motion.div>
                </div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <h2 className="text-2xl font-bold font-serif mb-2 flex items-center gap-2 justify-center">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="together-gradient bg-clip-text text-transparent">
                      Power Couple!
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    You both crushed your goals today!
                  </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="mt-6 flex items-center gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-[var(--you-color)] mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{userName}</p>
                    <p className="text-sm font-semibold text-success">On Goal</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-[var(--partner-color)] mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{partnerName.split(" ")[0]}</p>
                    <p className="text-sm font-semibold text-success">On Goal</p>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="together-gradient text-white font-semibold px-8"
                  >
                    Keep It Up!
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ConfettiEffect() {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      delay: number;
      duration: number;
      color: string;
      size: number;
    }>
  >([]);

  useEffect(() => {
    const colors = [
      "var(--you-color)",
      "var(--partner-color)",
      "#fbbf24", // amber
      "#a855f7", // purple
    ];

    const generated = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
    }));

    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: "-20px",
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: 400,
            opacity: [1, 1, 0],
            rotate: 720,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeIn",
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
}

// Hook to manage joint celebration state
export function useJointCelebration() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);

  const checkAndShowCelebration = useCallback(
    (userOnGoal: boolean, partnerOnGoal: boolean) => {
      if (userOnGoal && partnerOnGoal && !hasShownToday) {
        setShowCelebration(true);
        setHasShownToday(true);
      }
    },
    [hasShownToday]
  );

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Reset hasShownToday at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setHasShownToday(false);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [hasShownToday]);

  return {
    showCelebration,
    setShowCelebration,
    checkAndShowCelebration,
    closeCelebration,
  };
}
