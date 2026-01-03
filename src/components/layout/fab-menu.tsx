"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Zap, ScanBarcode, BookOpen, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const fabItems = [
  { icon: Zap, label: "Quick", href: "/log?tab=search", color: "bg-amber-500" },
  { icon: ScanBarcode, label: "Scan", action: "barcode" as const, color: "bg-blue-500" },
  { icon: BookOpen, label: "Recipe", href: "/log?tab=recipes", color: "bg-emerald-500" },
  { icon: Sparkles, label: "Estimate", href: "/log?tab=meal", color: "bg-violet-500" },
];

interface FABMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBarcodeOpen: () => void;
}

export function FABMenu({ isOpen, onOpenChange, onBarcodeOpen }: FABMenuProps) {
  const router = useRouter();

  const handleItemClick = (item: (typeof fabItems)[0]) => {
    if (item.action === "barcode") {
      onBarcodeOpen();
    } else if (item.href) {
      router.push(item.href);
    }
    onOpenChange(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="relative -mt-6 z-50">
        {/* Radial Menu Items */}
        <AnimatePresence>
          {isOpen &&
            fabItems.map((item, index) => {
              // Position items in a semi-circle above the FAB
              // 4 items spread from 180° to 0° (left to right arc above)
              const totalItems = fabItems.length;
              const spreadAngle = 135; // Degrees to spread across
              const startAngle = 180 + (180 - spreadAngle) / 2; // Center the arc
              const angleStep = spreadAngle / (totalItems - 1);
              const angleDeg = startAngle + index * angleStep;
              const angle = angleDeg * (Math.PI / 180);
              const radius = 80;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              const Icon = item.icon;

              return (
                <motion.button
                  key={item.label}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  animate={{ scale: 1, opacity: 1, x, y }}
                  exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  transition={{
                    delay: index * 0.04,
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "absolute w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                    "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    item.color
                  )}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Labels that appear after animation */}
        <AnimatePresence>
          {isOpen &&
            fabItems.map((item, index) => {
              const totalItems = fabItems.length;
              const spreadAngle = 135;
              const startAngle = 180 + (180 - spreadAngle) / 2;
              const angleStep = spreadAngle / (totalItems - 1);
              const angleDeg = startAngle + index * angleStep;
              const angle = angleDeg * (Math.PI / 180);
              const radius = 80;
              const labelRadius = radius + 35;
              const x = Math.cos(angle) * labelRadius;
              const y = Math.sin(angle) * labelRadius;

              return (
                <motion.span
                  key={`label-${item.label}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    delay: index * 0.04 + 0.1,
                    duration: 0.15,
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium text-foreground/80 pointer-events-none whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              );
            })}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => onOpenChange(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30",
            isOpen && "from-muted-foreground to-muted-foreground/80"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open add menu"}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Plus className="w-6 h-6 text-primary-foreground" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
