"use client";

import { useState, useEffect } from "react";
import { Search, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";
import type { FoodProduct } from "@/types/food";
import type { ResolvedMealIngredient } from "./meal-ingredient-row";

interface MealSwapSheetProps {
  ingredient: ResolvedMealIngredient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (ingredient: ResolvedMealIngredient, newProduct: FoodProduct) => void;
}

export function MealSwapSheet({
  ingredient,
  open,
  onOpenChange,
  onSelect,
}: MealSwapSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when opening with new ingredient
  useEffect(() => {
    if (open && ingredient) {
      setSearchQuery(ingredient.ingredientName);
    }
  }, [open, ingredient]);

  // Search for alternatives
  const searchResult = trpc.food.searchFast.useQuery(
    { query: searchQuery },
    {
      enabled: open && searchQuery.length >= 2,
      staleTime: 30000,
    }
  );

  const handleSelect = (product: FoodProduct) => {
    if (ingredient) {
      onSelect(ingredient, product);
      onOpenChange(false);
    }
  };

  const products = searchResult.data?.products ?? ingredient?.alternatives ?? [];
  const isSearching = searchResult.isFetching;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>
            {ingredient
              ? `${ingredient.quantity}${ingredient.unit} ${ingredient.ingredientName}`
              : "Select Food"}
          </SheetTitle>
          <SheetDescription>
            {ingredient?.matchedProduct
              ? "Tap to select a different match"
              : "Search and select the correct food"}
          </SheetDescription>
        </SheetHeader>

        {/* Search input */}
        <div className="relative px-4 pb-2">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            className="pl-9"
          />
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {isSearching && products.length === 0 ? (
            // Loading skeletons
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {searchQuery.length < 2
                ? "Type at least 2 characters to search"
                : "No foods found. Try a different search term."}
            </p>
          ) : (
            products.map((product) => {
              const isSelected = ingredient?.matchedProduct?.id === product.id;
              const calories = ingredient
                ? Math.round((product.caloriesPer100g * ingredient.normalizedGrams) / 100)
                : product.caloriesPer100g;

              return (
                <Button
                  key={product.id}
                  variant="ghost"
                  className={cn(
                    "w-full h-auto p-3 justify-start text-left",
                    isSelected && "bg-primary/10 border border-primary/30"
                  )}
                  onClick={() => handleSelect(product)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{product.name}</p>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground truncate">
                        {product.brand}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {calories} kcal
                      {ingredient
                        ? ` for ${ingredient.normalizedGrams}g`
                        : " per 100g"}{" "}
                      · P: {Math.round((product.proteinPer100g * (ingredient?.normalizedGrams ?? 100)) / 100)}g
                    </p>
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
