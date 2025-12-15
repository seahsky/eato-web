"use client";

import { type ReactNode } from "react";
import { EnergyProvider } from "@/contexts/energy-context";
import { trpc } from "@/trpc/react";
import type { EnergyUnit } from "@/lib/energy";

export function DashboardProviders({ children }: { children: ReactNode }) {
  const { data: profile } = trpc.profile.get.useQuery();

  // Default to KCAL if no profile or energyUnit not set
  const initialUnit: EnergyUnit = (profile?.energyUnit as EnergyUnit) ?? "KCAL";
  const hasProfile = !!profile;

  return (
    <EnergyProvider initialUnit={initialUnit} hasProfile={hasProfile}>
      {children}
    </EnergyProvider>
  );
}
