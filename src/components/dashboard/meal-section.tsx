"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Coffee, Sun, Moon, Cookie, MoreHorizontal, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyValue } from "@/components/ui/energy-value";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FoodEntryEditSheet } from "@/components/food/food-entry-edit-sheet";
import Link from "next/link";
import type { FoodEntry } from "@prisma/client";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";

const mealConfig = {
  BREAKFAST: { icon: Coffee, label: "Breakfast", color: "text-chart-3" },
  LUNCH: { icon: Sun, label: "Lunch", color: "text-chart-1" },
  DINNER: { icon: Moon, label: "Dinner", color: "text-chart-2" },
  SNACK: { icon: Cookie, label: "Snacks", color: "text-chart-5" },
};

interface MealSectionProps {
  mealType: keyof typeof mealConfig;
  entries: FoodEntry[];
  delay?: number;
  hasPartner?: boolean;
  selectedDate?: Date;
  currentUserId?: string;
}

export function MealSection({
  mealType,
  entries,
  delay = 0,
  hasPartner = false,
  selectedDate = new Date(),
  currentUserId,
}: MealSectionProps) {
  const config = mealConfig[mealType];
  const Icon = config.icon;
  const utils = trpc.useUtils();
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only count approved entries toward total calories
  const approvedEntries = entries.filter((e) => e.approvalStatus === "APPROVED");
  const totalCalories = approvedEntries.reduce((sum, e) => sum + e.calories, 0);

  const cloneMutation = trpc.food.cloneMealToPartner.useMutation({
    onSuccess: (result) => {
      if (result.clonedCount === 0) {
        toast.info("No items to clone for this meal");
      } else {
        toast.success(
          `Cloned ${result.clonedCount} item${result.clonedCount > 1 ? "s" : ""} to ${result.partnerName}'s ${config.label.toLowerCase()}`
        );
        utils.food.getPendingApprovalCount.invalidate();
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clone meal");
    },
  });

  const handleCloneToPartner = () => {
    cloneMutation.mutate({
      mealType,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-muted ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{config.label}</h3>
            {entries.length === 0 ? (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 gap-1.5 -ml-2">
                <Link
                  href={`/log?meal=${mealType.toLowerCase()}&date=${format(selectedDate, "yyyy-MM-dd")}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add first {config.label.toLowerCase()}
                </Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {entries.length} item{entries.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <EnergyValue
            kcal={totalCalories}
            toggleable
            className="text-sm font-semibold mr-1"
          />
          {hasPartner && approvedEntries.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 rounded-full"
                  aria-label={`More options for ${config.label}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleCloneToPartner}
                  disabled={cloneMutation.isPending}
                >
                  {cloneMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Clone to Partner
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Link href={`/log?meal=${mealType.toLowerCase()}&date=${format(selectedDate, "yyyy-MM-dd")}`}>
            <Button
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full"
              aria-label={`Add ${config.label.toLowerCase()}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {entries.length > 0 && (
        <ul role="list" className="space-y-1 mt-3 pt-3 border-t border-border/50">
          {(isExpanded ? entries : entries.slice(0, 3)).map((entry) => {
            const isPending = entry.approvalStatus === "PENDING";
            return (
              <li key={entry.id}>
                <button
                  onClick={() => setEditEntry(entry)}
                  className="flex items-center justify-between text-sm w-full text-left p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {entry.imageUrl && (
                      <img
                        src={entry.imageUrl}
                        alt={entry.name}
                        className={cn(
                          "w-8 h-8 rounded-lg object-cover",
                          isPending && "opacity-50"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "truncate",
                        isPending
                          ? "text-muted-foreground/60 italic"
                          : "text-muted-foreground"
                      )}
                    >
                      {entry.name}
                    </span>
                    {isPending && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <EnergyValue
                    kcal={entry.calories}
                    className={cn(
                      "font-medium ml-2",
                      isPending && "text-muted-foreground/60"
                    )}
                  />
                </button>
              </li>
            );
          })}
          {entries.length > 3 && (
            <li>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground text-center pt-1 w-full transition-colors"
              >
                {isExpanded ? "Show less" : `+${entries.length - 3} more`}
              </button>
            </li>
          )}
        </ul>
      )}

      <FoodEntryEditSheet
        entry={editEntry}
        open={!!editEntry}
        onOpenChange={(open) => !open && setEditEntry(null)}
        currentUserId={currentUserId}
      />
    </motion.div>
  );
}
