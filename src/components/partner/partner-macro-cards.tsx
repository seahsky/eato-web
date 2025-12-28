"use client";

import { MacroCard } from "@/components/dashboard/macro-card";
import { trpc } from "@/trpc/react";
import { calculateMacroTargets } from "@/lib/bmr";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils } from "lucide-react";

interface PartnerMacroCardsProps {
  date?: Date;
}

export function PartnerMacroCards({ date = new Date() }: PartnerMacroCardsProps) {
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: partnerProfile, isLoading: profileLoading } =
    trpc.profile.getPartnerProfile.useQuery();

  const { data: partnerSummary, isLoading: summaryLoading } =
    trpc.stats.getPartnerDailySummary.useQuery({ date: dateStr });

  if (profileLoading || summaryLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!partnerProfile || !partnerSummary) {
    return null;
  }

  const calorieGoal = partnerProfile.calorieGoal ?? 2000;
  const macroTargets = calculateMacroTargets(calorieGoal);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Utensils className="w-4 h-4" />
          {partnerProfile.partnerName}&apos;s Macros Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <MacroCard
            label="Protein"
            current={partnerSummary.totalProtein}
            goal={macroTargets.protein}
            color="var(--chart-1)"
            delay={0.1}
          />
          <MacroCard
            label="Carbs"
            current={partnerSummary.totalCarbs}
            goal={macroTargets.carbs}
            color="var(--chart-3)"
            delay={0.2}
          />
          <MacroCard
            label="Fat"
            current={partnerSummary.totalFat}
            goal={macroTargets.fat}
            color="var(--chart-4)"
            delay={0.3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
