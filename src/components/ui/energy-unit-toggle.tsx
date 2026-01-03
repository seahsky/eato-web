"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { useEnergyUnit } from "@/contexts/energy-context";
import { getEnergyLabel } from "@/lib/energy";
import { cn } from "@/lib/utils";

export function EnergyUnitToggle({ className }: { className?: string }) {
  const { energyUnit, toggleUnit, isUpdating } = useEnergyUnit();

  return (
    <button
      onClick={toggleUnit}
      disabled={isUpdating}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      aria-label={`Currently showing energy in ${getEnergyLabel(energyUnit)}. Tap to switch.`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={energyUnit}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="min-w-[28px] text-center"
        >
          {getEnergyLabel(energyUnit)}
        </motion.span>
      </AnimatePresence>
      {isUpdating ? (
        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
      ) : (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
}
