"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertToKcal, formatEnergy, getEnergyLabel } from "@/lib/energy";
import type { EnergyUnit } from "@/lib/energy";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

interface QuickEnergyFormProps {
  defaultMealType?: string;
  onSuccess?: () => void;
}

export function QuickEnergyForm({
  defaultMealType = "LUNCH",
  onSuccess,
}: QuickEnergyFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { energyUnit: userPreferredUnit } = useEnergyUnit();

  const [energyValue, setEnergyValue] = useState(500);
  const [inputUnit, setInputUnit] = useState<EnergyUnit>(userPreferredUnit);
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState(defaultMealType);
  const [logForPartner, setLogForPartner] = useState(false);

  // Get user info to check for partner
  const { data: user } = trpc.auth.getMe.useQuery();
  const hasPartner = !!user?.partner;

  // Calculate kcal value for storage
  const caloriesKcal = convertToKcal(energyValue, inputUnit);

  const logMutation = trpc.food.log.useMutation({
    onSuccess: () => {
      if (logForPartner) {
        toast.success(`Energy logged for ${user?.partner?.name}! They will need to approve it.`);
        utils.food.getMyPendingSubmissions.invalidate();
      } else {
        toast.success("Energy logged successfully!");
      }
      utils.stats.getDailySummary.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log energy");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    logMutation.mutate({
      name: description.trim() || "Quick Energy",
      calories: caloriesKcal,
      servingSize: 1,
      servingUnit: "serving",
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
      consumedAt: format(new Date(), "yyyy-MM-dd"),
      isManualEntry: true,
      forPartnerId: logForPartner ? user?.partner?.id : undefined,
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-serif">Quick Energy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Energy Input */}
          <div className="space-y-2">
            <Label>Energy</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={energyValue}
                onChange={(e) => setEnergyValue(Number(e.target.value))}
                className="flex-1 text-lg font-semibold"
                min={0}
                required
              />
              <Select
                value={inputUnit}
                onValueChange={(value) => setInputUnit(value as EnergyUnit)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KCAL">kcal</SelectItem>
                  <SelectItem value="KJ">kJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inputUnit === "KJ" && (
              <p className="text-xs text-muted-foreground">
                = {caloriesKcal} kcal
              </p>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label>
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Lunch at restaurant"
            />
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Meal</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                <SelectItem value="LUNCH">Lunch</SelectItem>
                <SelectItem value="DINNER">Dinner</SelectItem>
                <SelectItem value="SNACK">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Log for Partner Toggle */}
          {hasPartner && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="log-for-partner-quick" className="text-sm font-normal cursor-pointer">
                    Log for {user?.partner?.name}
                  </Label>
                </div>
                <Switch
                  id="log-for-partner-quick"
                  checked={logForPartner}
                  onCheckedChange={setLogForPartner}
                />
              </div>
              {logForPartner && (
                <p className="text-xs text-muted-foreground text-center">
                  {user?.partner?.name} will need to approve this entry
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={logMutation.isPending}
          >
            {logMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${formatEnergy(caloriesKcal, userPreferredUnit)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
