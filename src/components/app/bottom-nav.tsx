"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, BarChart3, Users, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", icon: Grid2x2, label: "Today" },
  { href: "/week", icon: BarChart3, label: "Week" },
  { href: "/partner", icon: Users, label: "Friends" },
  { href: "/profile", icon: Ellipsis, label: "More" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg">
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
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-[var(--duration-instant)] active:scale-95",
                isActive ? "text-[var(--primary)]" : "text-[var(--text-mute)]"
              )}
            >
              <tab.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
