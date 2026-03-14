"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Clock, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", icon: BookOpen, label: "Diary" },
  { href: "/week", icon: CalendarDays, label: "Week" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/profile", icon: UserRound, label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const activeIndex = tabs.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(tab.href + "/")
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[calc(env(safe-area-inset-bottom)+0.5rem)]" aria-label="Main navigation">
      <div className="relative mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-[color,transform] duration-[var(--duration-instant)] active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        {/* Sliding indicator */}
        {activeIndex >= 0 && (
          <span
            className="absolute bottom-0 h-0.5 w-5 rounded-full bg-primary transition-[left] duration-[var(--duration-normal)] ease-[var(--ease-out-expo)]"
            style={{ left: `calc(${activeIndex * 25}% + 12.5% - 10px)` }}
          />
        )}
      </div>
    </nav>
  );
}
