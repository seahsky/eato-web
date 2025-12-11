"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  // Listen for navigation start via custom event from BottomNav
  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true);
      setProgress(0);
    };

    window.addEventListener("navigation-start", handleStart);
    return () => window.removeEventListener("navigation-start", handleStart);
  }, []);

  // Reset when pathname changes (navigation complete)
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timeout = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  // Animate progress while navigating
  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        if (prev >= 90) return prev;
        if (prev >= 70) return prev + 1;
        if (prev >= 50) return prev + 3;
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isNavigating]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
