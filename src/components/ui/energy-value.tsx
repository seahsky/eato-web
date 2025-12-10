"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel, getOppositeUnit, type EnergyUnit } from "@/lib/energy";
import { cn } from "@/lib/utils";

interface EnergyValueProps {
  kcal: number;
  showUnit?: boolean;
  toggleable?: boolean;
  className?: string;
  unitClassName?: string;
}

export function EnergyValue({
  kcal,
  showUnit = true,
  toggleable = false,
  className,
  unitClassName,
}: EnergyValueProps) {
  const { energyUnit, toggleUnit } = useEnergyUnit();
  const [localUnit, setLocalUnit] = useState<EnergyUnit | null>(null);

  // Use local override if set, otherwise use global
  const displayUnit = localUnit ?? energyUnit;
  const value = convertEnergy(kcal, displayUnit);
  const label = getEnergyLabel(displayUnit);

  const handleClick = useCallback(() => {
    if (!toggleable) return;

    // Toggle locally first (temporary view)
    if (localUnit === null) {
      // First tap: show alternate unit temporarily
      setLocalUnit(getOppositeUnit(energyUnit));
    } else {
      // Second tap: reset to global
      setLocalUnit(null);
    }
  }, [toggleable, localUnit, energyUnit]);

  const handleDoubleClick = useCallback(() => {
    if (!toggleable) return;
    // Double-tap: permanently change global preference
    toggleUnit();
    setLocalUnit(null);
  }, [toggleable, toggleUnit]);

  if (!toggleable) {
    return (
      <span className={className}>
        {value}
        {showUnit && <span className={unitClassName}> {label}</span>}
      </span>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "inline-flex items-baseline gap-0.5 cursor-pointer",
        "hover:opacity-80 active:scale-95 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded",
        className
      )}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${value}-${displayUnit}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.15 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {showUnit && (
        <span className={cn("text-muted-foreground", unitClassName)}>
          {" "}{label}
          {localUnit !== null && (
            <span className="ml-1 text-[10px] opacity-60">(tap to reset)</span>
          )}
        </span>
      )}
    </motion.button>
  );
}
