"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Plus, Users, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { trpc } from "@/trpc/react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/log", icon: Plus, label: "Add", isMain: true },
  { href: "/partner", icon: Users, label: "Partner" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Fetch pending approval count for badge
  const { data: pendingCount } = trpc.food.getPendingApprovalCount.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleNavigation = (href: string) => {
    if (href === pathname) return;

    setPendingHref(href);
    window.dispatchEvent(new CustomEvent("navigation-start"));

    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isPendingNav = pendingHref === item.href && isPending;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className="relative -mt-6"
              >
                <motion.div
                  className={cn(
                    "w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30",
                    isPendingNav && "opacity-70"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon className={cn(
                    "w-6 h-6 text-primary-foreground transition-transform",
                    isPendingNav && "animate-pulse"
                  )} />
                </motion.div>
              </button>
            );
          }

          const badgeCount = item.href === "/partner" ? (pendingCount?.count ?? 0) : 0;

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className="relative flex flex-col items-center gap-1 px-3 py-2 group"
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                className="relative"
                whileTap={{ scale: 0.9 }}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                    isPendingNav && "text-primary animate-pulse"
                  )}
                />
                {(isActive || isPendingNav) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={cn(
                      "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary",
                      isPendingNav && "animate-pulse"
                    )}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                {/* Pending approvals badge */}
                <AnimatePresence>
                  {badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-semibold shadow-sm"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground",
                  isPendingNav && "text-primary"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
