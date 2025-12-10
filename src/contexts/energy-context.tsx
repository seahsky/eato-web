"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { EnergyUnit } from "@/lib/energy";
import { getOppositeUnit } from "@/lib/energy";
import { trpc } from "@/trpc/react";

interface EnergyContextValue {
  energyUnit: EnergyUnit;
  setEnergyUnit: (unit: EnergyUnit) => void;
  toggleUnit: () => void;
  isUpdating: boolean;
}

const EnergyContext = createContext<EnergyContextValue>({
  energyUnit: "KCAL",
  setEnergyUnit: () => {},
  toggleUnit: () => {},
  isUpdating: false,
});

export function EnergyProvider({
  children,
  initialUnit = "KCAL",
}: {
  children: ReactNode;
  initialUnit?: EnergyUnit;
}) {
  const [energyUnit, setEnergyUnitState] = useState<EnergyUnit>(initialUnit);
  const utils = trpc.useUtils();

  // Sync with initialUnit when it changes (e.g., profile loads)
  useEffect(() => {
    setEnergyUnitState(initialUnit);
  }, [initialUnit]);

  const updateMutation = trpc.profile.updateEnergyUnit.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
    },
  });

  const setEnergyUnit = useCallback((unit: EnergyUnit) => {
    setEnergyUnitState(unit);
    updateMutation.mutate({ energyUnit: unit });
  }, [updateMutation]);

  const toggleUnit = useCallback(() => {
    const newUnit = getOppositeUnit(energyUnit);
    setEnergyUnit(newUnit);
  }, [energyUnit, setEnergyUnit]);

  return (
    <EnergyContext.Provider
      value={{
        energyUnit,
        setEnergyUnit,
        toggleUnit,
        isUpdating: updateMutation.isPending,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergyUnit() {
  return useContext(EnergyContext);
}
