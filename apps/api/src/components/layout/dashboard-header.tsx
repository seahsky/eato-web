"use client";

import { EnergyUnitToggle } from "@/components/ui/energy-unit-toggle";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-end">
        <EnergyUnitToggle />
      </div>
    </header>
  );
}
