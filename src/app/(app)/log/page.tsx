"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { usePetReaction } from "@/components/app/pixel-pet/pet-reaction-provider";
import { parseIngredientLines } from "@/lib/meal-parser";
import type { FoodProduct } from "@/types/food";

interface ReviewItem {
  id: string;
  rawLine: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  normalizedGrams: number;
  isDirectEnergy?: boolean;
  directCalories?: number;
  parseError?: string;
  matchedProduct?: FoodProduct | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
}

type Stage = "input" | "review" | "saving";

export default function LogPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { triggerReaction } = usePetReaction();

  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const batchLog = trpc.food.batchLog.useMutation();

  async function handleCalculate() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const parsed = parseIngredientLines(trimmed);
    if (parsed.length === 0) {
      toast.error("No valid items found. Use format: 200g chicken breast");
      return;
    }

    if (parsed.length > 15) {
      toast.error("Maximum 15 items per batch");
      return;
    }

    setIsSearching(true);

    // Build queries for items that need nutrition lookup
    const queries = parsed
      .filter((p) => !p.parseError && !p.isDirectEnergy)
      .map((p) => ({
        id: p.id,
        query: p.ingredientName,
      }));

    try {
      // Fetch nutrition data via batchSearch
      let searchResults: Array<{
        id: string;
        query: string;
        products: FoodProduct[];
      }> = [];

      if (queries.length > 0) {
        const result = await utils.client.food.batchSearch.query({
          queries,
        });
        searchResults = result as typeof searchResults;
      }

      // Map results back to parsed items
      const items: ReviewItem[] = parsed.map((p) => {
        if (p.parseError) {
          return {
            ...p,
            matchedProduct: null,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            servingSize: p.normalizedGrams,
            servingUnit: "g",
          };
        }

        if (p.isDirectEnergy) {
          return {
            ...p,
            matchedProduct: null,
            calories: p.directCalories ?? 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            servingSize: 1,
            servingUnit: "serving",
          };
        }

        const match = searchResults.find((r) => r.id === p.id);
        const product = match?.products?.[0] ?? null;

        if (product) {
          const factor = p.normalizedGrams / 100;
          return {
            ...p,
            matchedProduct: product,
            calories: Math.round(product.caloriesPer100g * factor),
            protein: Math.round((product.proteinPer100g ?? 0) * factor * 10) / 10,
            carbs: Math.round((product.carbsPer100g ?? 0) * factor * 10) / 10,
            fat: Math.round((product.fatPer100g ?? 0) * factor * 10) / 10,
            servingSize: p.normalizedGrams,
            servingUnit: "g",
          };
        }

        return {
          ...p,
          matchedProduct: null,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          servingSize: p.normalizedGrams,
          servingUnit: "g",
        };
      });

      setReviewItems(items.filter((i) => !i.parseError));
      setStage("review");
    } catch (error) {
      console.error("Batch search failed:", error);
      toast.error("Failed to look up nutrition data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function removeItem(id: string) {
    setReviewItems((items) => items.filter((i) => i.id !== id));
  }

  function updateQuantity(id: string, newSize: number) {
    setReviewItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (item.isDirectEnergy) return item;

        const product = item.matchedProduct;
        if (!product) return { ...item, servingSize: newSize };

        const factor = newSize / 100;
        return {
          ...item,
          servingSize: newSize,
          normalizedGrams: newSize,
          calories: Math.round(product.caloriesPer100g * factor),
          protein: Math.round((product.proteinPer100g ?? 0) * factor * 10) / 10,
          carbs: Math.round((product.carbsPer100g ?? 0) * factor * 10) / 10,
          fat: Math.round((product.fatPer100g ?? 0) * factor * 10) / 10,
        };
      })
    );
  }

  const totalCalories = reviewItems.reduce((sum, i) => sum + i.calories, 0);

  async function handleLogAll() {
    if (reviewItems.length === 0) return;

    setStage("saving");
    const mealGroupId = crypto.randomUUID();
    const consumedAt = format(new Date(), "yyyy-MM-dd");

    try {
      await batchLog.mutateAsync({
        mealGroupId,
        consumedAt,
        entries: reviewItems.map((item) => ({
          name: item.matchedProduct?.name ?? item.ingredientName,
          brand: item.matchedProduct?.brand ?? null,
          calories: item.calories,
          protein: item.protein || undefined,
          carbs: item.carbs || undefined,
          fat: item.fat || undefined,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
          mealGroupId,
          consumedAt,
          dataSource: (item.matchedProduct?.dataSource as "FATSECRET" | "MANUAL") ?? "MANUAL",
          fatSecretId: item.matchedProduct?.fatSecretId ?? undefined,
          isManualEntry: !item.matchedProduct,
        })),
      });
      triggerReaction("food_logged");
      utils.stats.getDailySummary.invalidate();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Batch log failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to log food. Please try again."
      );
      setStage("review");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <Link href="/dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-caveat text-xl">
          {stage === "input" ? "What did you eat?" : "Review your meal"}
        </h1>
      </div>

      {/* Stage 1: Textarea Input */}
      {stage === "input" && (
        <div className="space-y-4">
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={6}
            placeholder={"200g chicken breast\n100g rice\n2 eggs\n352kj canned salmon"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            One item per line. Format: quantity + unit + food name (e.g. 200g chicken breast)
          </p>
          <Button
            className="w-full"
            disabled={!text.trim() || isSearching}
            onClick={handleCalculate}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Looking up nutrition...
              </>
            ) : (
              "Calculate"
            )}
          </Button>
        </div>
      )}

      {/* Stage 2: Review */}
      {stage === "review" && (
        <div className="space-y-3">
          {reviewItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No items to log.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setStage("input")}
              >
                Go back
              </Button>
            </div>
          ) : (
            <>
              {reviewItems.map((item, i) => (
                <Card
                  key={item.id}
                  className={
                    i < 5
                      ? `animate-fade-in-delay-${i}`
                      : "animate-fade-in-delay-4"
                  }
                >
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">
                          {item.matchedProduct?.name ?? item.ingredientName}
                        </div>
                        {item.matchedProduct?.brand && (
                          <div className="text-xs text-muted-foreground">
                            {item.matchedProduct.brand}
                          </div>
                        )}
                        {!item.matchedProduct && !item.isDirectEnergy && (
                          <div className="text-xs text-amber-600">
                            No match found — calories set to 0
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-muted-foreground">
                          ~{item.calories} kcal
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${item.ingredientName}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Editable quantity */}
                    {!item.isDirectEnergy && (
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.servingSize}
                          onChange={(e) =>
                            updateQuantity(item.id, Number(e.target.value) || 1)
                          }
                          className="h-8 w-20 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.servingUnit}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Summary */}
              <div className="rounded-md bg-muted/50 px-4 py-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""}{" "}
                  &middot; ~{totalCalories} kcal total
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStage("input")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={reviewItems.length === 0}
                  onClick={handleLogAll}
                >
                  Log all
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stage 3: Saving */}
      {stage === "saving" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Saving your meal...</p>
        </div>
      )}
    </div>
  );
}
