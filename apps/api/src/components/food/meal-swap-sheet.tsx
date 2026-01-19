"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { EnergyValue } from "@/components/ui/energy-value";
import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
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
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Keep track of previous results to show while loading
  const previousResultsRef = useRef<FoodProduct[]>([]);

  // Reset search when opening with new ingredient
  useEffect(() => {
    if (open && ingredient) {
      setSearchQuery(ingredient.ingredientName);
      previousResultsRef.current = [];
    }
  }, [open, ingredient]);

  // Fast search - returns cached or fastest API response
  const {
    data: fastData,
    isLoading: fastLoading,
    isFetching: fastFetching,
  } = trpc.food.searchFast.useQuery(
    { query: debouncedQuery },
    {
      enabled: open && debouncedQuery.length >= 2,
      staleTime: 30000,
    }
  );

  // Full search - returns complete merged results from both APIs
  const {
    data: fullData,
    isLoading: fullLoading,
    isFetching: fullFetching,
  } = trpc.food.search.useQuery(
    { query: debouncedQuery },
    {
      enabled: open && debouncedQuery.length >= 2,
      staleTime: 5000,
    }
  );

  // Use full results if available, otherwise fast results, then alternatives
  const displayData = fullData ?? fastData;
  const isLoading = fastLoading && fullLoading;
  const isFetching = fastFetching || fullFetching;

  // Update previous results when we have data
  useEffect(() => {
    if (displayData?.products && displayData.products.length > 0) {
      previousResultsRef.current = displayData.products;
    }
  }, [displayData]);

  // Show previous results (dimmed) while loading new query
  const showPreviousResults =
    isLoading &&
    debouncedQuery.length >= 2 &&
    previousResultsRef.current.length > 0;

  // Check if results came from cache (instant)
  const isFromCache = (fastData as { fromCache?: boolean })?.fromCache;

  const handleSelect = (product: FoodProduct) => {
    if (ingredient) {
      onSelect(ingredient, product);
      onOpenChange(false);
    }
  };

  // Use search results, or fall back to alternatives from ingredient
  const searchProducts = displayData?.products ?? [];
  const products = searchProducts.length > 0
    ? searchProducts.slice(0, 10)
    : (ingredient?.alternatives ?? []).slice(0, 10);

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
          {isFetching && (
            <Loader2 className="absolute right-7 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          <AnimatePresence mode="wait">
            {showPreviousResults ? (
              // Show previous results dimmed while loading new query
              <motion.div
                key="previous-results"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0.4 }}
                className="space-y-2"
              >
                <p className="text-xs text-muted-foreground animate-pulse">
                  Searching for &ldquo;{debouncedQuery}&rdquo;...
                </p>
                {previousResultsRef.current.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border pointer-events-none"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-sm">{product.name}</p>
                    </div>
                    <Skeleton className="h-3 w-1/2 mt-1" />
                  </div>
                ))}
              </motion.div>
            ) : isLoading && debouncedQuery.length >= 2 ? (
              // Initial loading state with skeletons
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground animate-pulse">
                  Searching for &ldquo;{debouncedQuery}&rdquo;...
                </p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8 text-sm"
              >
                {searchQuery.length < 2
                  ? "Type at least 2 characters to search"
                  : "No foods found. Try a different search term."}
              </motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {/* Cache indicator */}
                {isFromCache && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <Zap className="w-3 h-3" />
                    <span>Instant results</span>
                  </div>
                )}
                {products.map((product: FoodProduct, index: number) => {
                  const isSelected = ingredient?.matchedProduct?.id === product.id;
                  const grams = ingredient?.normalizedGrams ?? 100;
                  const calories = Math.round((product.caloriesPer100g * grams) / 100);
                  const protein = Math.round((product.proteinPer100g * grams) / 100);

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-auto p-3 justify-start text-left",
                          isSelected && "bg-primary/10 border border-primary/30"
                        )}
                        onClick={() => handleSelect(product)}
                      >
                        {/* Product image or placeholder */}
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover bg-muted shrink-0 mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted shrink-0 mr-3 flex items-center justify-center">
                            {product.dataSource === "USDA" ? (
                              <span className="text-[10px] font-medium text-green-600">USDA</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">No img</span>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate text-sm">{product.name}</p>
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {product.brand && (
                              <span className="text-xs text-muted-foreground truncate">
                                {product.brand}
                              </span>
                            )}
                            <DataSourceBadge source={product.dataSource} size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <EnergyValue kcal={calories} toggleable />
                            {ingredient
                              ? ` for ${grams}g`
                              : " per 100g"}{" "}
                            · P: {protein}g
                          </p>
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
                {/* Loading indicator for full results */}
                {fullFetching && !fullData && (
                  <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                    Loading more results...
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
