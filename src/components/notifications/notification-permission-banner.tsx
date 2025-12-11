"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { motion, AnimatePresence } from "framer-motion";

const DISMISS_KEY = "notification_prompt_dismissed";
const DISMISS_DURATION_DAYS = 7;

export function NotificationPermissionBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden
  const { isSupported, permission, isSubscribed, subscribe, isLoading } =
    usePushNotifications();

  // Check dismissal state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismiss =
        (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);

      // Only show again if enough time has passed
      if (daysSinceDismiss < DISMISS_DURATION_DAYS) {
        setIsDismissed(true);
        return;
      }
    }

    // Show banner if permission is default and not subscribed
    if (isSupported && permission === "default" && !isSubscribed) {
      setIsDismissed(false);
    }
  }, [isSupported, permission, isSubscribed]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setIsDismissed(true);
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsDismissed(true);
    }
  };

  // Don't render if not supported, already subscribed, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-secondary/50 border border-secondary rounded-xl p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">Stay connected</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get notified when your partner logs meals or reaches their goals
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isLoading}
                className="h-8 text-xs"
              >
                Enable notifications
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-xs"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
