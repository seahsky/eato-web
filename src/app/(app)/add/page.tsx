"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { usePetReaction } from "@/components/app/pixel-pet/pet-reaction-provider";
import { MealTypePills } from "@/components/app/meal-type-pills";
import { COPY } from "@/lib/copy";
import type { MealType } from "@/server/client-types";

const MOOD_EMOJIS = [
  { emoji: "\u{1F60A}", label: "Happy" },
  { emoji: "\u{1F60C}", label: "Content" },
  { emoji: "\u{1F610}", label: "Neutral" },
  { emoji: "\u{1F614}", label: "Meh" },
  { emoji: "\u{1F62B}", label: "Tired" },
];

export default function AddFoodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();
  const { triggerReaction } = usePetReaction();

  // Parse product from search params
  const product = useMemo(() => {
    const raw = searchParams.get("product");
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw)) as {
        id: string;
        name: string;
        brand?: string;
        caloriesPer100g: number;
        proteinPer100g?: number;
        carbsPer100g?: number;
        fatPer100g?: number;
        fiberPer100g?: number;
        servingSize: number;
        servingUnit: string;
        dataSource?: string;
        fatSecretId?: string;
      };
    } catch {
      return null;
    }
  }, [searchParams]);

  const [servingSize, setServingSize] = useState(product?.servingSize ?? 100);
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Manual entry form
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState<number | "">("");
  const [manualProtein, setManualProtein] = useState<number | "">("");
  const [manualCarbs, setManualCarbs] = useState<number | "">("");
  const [manualFat, setManualFat] = useState<number | "">("");
  const [manualServingSize, setManualServingSize] = useState(100);
  const [manualServingUnit, setManualServingUnit] = useState("g");

  const logFood = trpc.food.log.useMutation();

  // Calculate nutrition for product mode
  const nutrition = useMemo(() => {
    if (!product) return null;
    const factor = servingSize / 100;
    return {
      calories: Math.round((product.caloriesPer100g ?? 0) * factor),
      protein: Math.round((product.proteinPer100g ?? 0) * factor * 10) / 10,
      carbs: Math.round((product.carbsPer100g ?? 0) * factor * 10) / 10,
      fat: Math.round((product.fatPer100g ?? 0) * factor * 10) / 10,
      fiber: Math.round((product.fiberPer100g ?? 0) * factor * 10) / 10,
    };
  }, [product, servingSize]);

  function saveMoodNote(entryId: string) {
    if (selectedMood || note) {
      try {
        const key = `eato-entry-meta-${entryId}`;
        localStorage.setItem(key, JSON.stringify({ mood: selectedMood, note }));
      } catch {
        // ignore localStorage errors
      }
    }
  }

  async function handleSaveProduct() {
    if (!product || !nutrition) return;

    // Show confirmation first
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setSaving(true);
    try {
      const result = await logFood.mutateAsync({
        name: product.name,
        brand: product.brand,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        servingSize,
        servingUnit: product.servingUnit,
        mealType: mealType ?? undefined,
        consumedAt: format(new Date(), "yyyy-MM-dd"),
        dataSource: (product.dataSource as "FATSECRET" | "MANUAL") ?? "FATSECRET",
        fatSecretId: product.fatSecretId,
      });
      saveMoodNote(result.id);
      triggerReaction("food_logged");
      utils.stats.getDailySummary.invalidate();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Failed to log food:", error);
      toast.error(error instanceof Error ? error.message : "Failed to log food. Please try again.");
      setSaving(false);
      setShowConfirmation(false);
    }
  }

  async function handleSaveManual() {
    if (!manualName || !manualCalories) return;

    // Show confirmation first
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setSaving(true);
    try {
      const result = await logFood.mutateAsync({
        name: manualName,
        calories: Number(manualCalories),
        protein: manualProtein ? Number(manualProtein) : undefined,
        carbs: manualCarbs ? Number(manualCarbs) : undefined,
        fat: manualFat ? Number(manualFat) : undefined,
        servingSize: manualServingSize,
        servingUnit: manualServingUnit,
        mealType: mealType ?? undefined,
        consumedAt: format(new Date(), "yyyy-MM-dd"),
        isManualEntry: true,
        dataSource: "MANUAL",
      });
      saveMoodNote(result.id);
      triggerReaction("food_logged");
      utils.stats.getDailySummary.invalidate();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Failed to log food:", error);
      toast.error(error instanceof Error ? error.message : "Failed to log food. Please try again.");
      setSaving(false);
      setShowConfirmation(false);
    }
  }

  const confirmCalories = product ? nutrition?.calories : manualCalories ? Number(manualCalories) : 0;

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <Link href="/search">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-caveat text-xl">{product ? COPY.addHeading : COPY.addManualHeading}</h1>
      </div>

      {/* Confirmation card */}
      {showConfirmation && confirmCalories !== undefined && confirmCalories > 0 && (
        <Card className="mb-4 animate-fade-in border-primary/20 bg-primary/5">
          <CardContent className="py-3 text-center">
            <p className="font-caveat text-lg text-foreground">
              {COPY.addConfirmation(confirmCalories)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Product mode */}
      {product ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{product.name}</CardTitle>
              {product.brand && (
                <p className="text-sm text-muted-foreground">{product.brand}</p>
              )}
            </CardHeader>
          </Card>

          {/* Serving size */}
          <div>
            <Label>Serving size ({product.servingUnit})</Label>
            <Input
              type="number"
              min={1}
              value={servingSize}
              onChange={(e) => setServingSize(Number(e.target.value) || 1)}
            />
          </div>

          {/* Meal type */}
          <div>
            <Label className="mb-1.5 block">Meal</Label>
            <MealTypePills value={mealType} onChange={setMealType} />
          </div>

          {/* Nutrition preview */}
          {nutrition && (
            <Card>
              <CardContent className="space-y-1 py-3 text-sm">
                <div className="flex justify-between">
                  <span>Calories</span>
                  <strong>{nutrition.calories} kcal</strong>
                </div>
                <div className="flex justify-between">
                  <span>Protein</span>
                  <span>{nutrition.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbs</span>
                  <span>{nutrition.carbs}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat</span>
                  <span>{nutrition.fat}g</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mood emoji row */}
          <div>
            <Label className="mb-1.5 block">How are you feeling?</Label>
            <div className="flex gap-3">
              {MOOD_EMOJIS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  className={`rounded-lg p-2.5 text-xl transition-transform duration-200 ${
                    selectedMood === m.emoji
                      ? "scale-110 bg-accent ring-2 ring-primary/30"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedMood(selectedMood === m.emoji ? null : m.emoji)}
                  aria-label={m.label}
                  aria-pressed={selectedMood === m.emoji}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <Label>Note</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              placeholder={COPY.moodPlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={saving} onClick={handleSaveProduct}>
            {saving ? "Saving..." : COPY.addButton}
          </Button>
        </div>
      ) : (
        /* Manual entry mode */
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Food name</Label>
              <Input
                placeholder="e.g., Chicken breast"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div>
              <Label>Calories (kcal)</Label>
              <Input
                type="number"
                min={0}
                value={manualCalories}
                onChange={(e) => setManualCalories(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            {/* Meal type */}
            <div>
              <Label className="mb-1.5 block">Meal</Label>
              <MealTypePills value={mealType} onChange={setMealType} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Serving size</Label>
                <Input
                  type="number"
                  min={1}
                  value={manualServingSize}
                  onChange={(e) => setManualServingSize(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <div className="flex gap-1">
                  {["g", "ml", "serving"].map((u) => (
                    <Button
                      key={u}
                      variant={manualServingUnit === u ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setManualServingUnit(u)}
                    >
                      {u}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mood emoji row */}
          <div>
            <Label className="mb-1.5 block">How are you feeling?</Label>
            <div className="flex gap-3">
              {MOOD_EMOJIS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  className={`rounded-lg p-2.5 text-xl transition-transform duration-200 ${
                    selectedMood === m.emoji
                      ? "scale-110 bg-accent ring-2 ring-primary/30"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedMood(selectedMood === m.emoji ? null : m.emoji)}
                  aria-label={m.label}
                  aria-pressed={selectedMood === m.emoji}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <Label>Note</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              placeholder={COPY.moodPlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={!manualName || !manualCalories || saving}
            onClick={handleSaveManual}
          >
            {saving ? "Saving..." : COPY.addButton}
          </Button>
        </div>
      )}
    </div>
  );
}
