"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Activity, Target, User } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { getEnergyLabel } from "@/lib/energy";
import { ACTIVITY_LABELS, type ActivityLevel } from "@/lib/bmr";

export function PartnerProfileCard() {
  const { energyUnit } = useEnergyUnit();
  const { data: partnerProfile, isLoading } =
    trpc.profile.getPartnerProfile.useQuery();

  if (isLoading) {
    return <Skeleton className="h-[200px] rounded-2xl" />;
  }

  if (!partnerProfile) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          {partnerProfile.partnerName}&apos;s Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BMR / TDEE / Goal */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-secondary/20 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center mx-auto mb-1.5">
              <Calculator className="w-4 h-4 text-secondary-foreground" />
            </div>
            <EnergyValue
              kcal={partnerProfile.bmr}
              showUnit={false}
              toggleable
              className="text-lg font-bold"
            />
            <p className="text-[10px] text-muted-foreground">
              BMR ({getEnergyLabel(energyUnit)})
            </p>
          </div>
          <div className="bg-secondary/20 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center mx-auto mb-1.5">
              <Activity className="w-4 h-4 text-secondary-foreground" />
            </div>
            <EnergyValue
              kcal={partnerProfile.tdee}
              showUnit={false}
              toggleable
              className="text-lg font-bold"
            />
            <p className="text-[10px] text-muted-foreground">
              TDEE ({getEnergyLabel(energyUnit)})
            </p>
          </div>
          <div className="bg-secondary/20 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center mx-auto mb-1.5">
              <Target className="w-4 h-4 text-secondary-foreground" />
            </div>
            <EnergyValue
              kcal={partnerProfile.calorieGoal}
              showUnit={false}
              toggleable
              className="text-lg font-bold"
            />
            <p className="text-[10px] text-muted-foreground">
              Goal ({getEnergyLabel(energyUnit)})
            </p>
          </div>
        </div>

        {/* Physical metrics & Activity Level */}
        <div className="pt-2 border-t border-secondary/20 space-y-2">
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>{partnerProfile.age} yrs</span>
            <span>•</span>
            <span>{partnerProfile.weight} kg</span>
            <span>•</span>
            <span>{partnerProfile.height} cm</span>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {ACTIVITY_LABELS[partnerProfile.activityLevel as ActivityLevel]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
