"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { trpc } from "@/trpc/react";
import { Search, Plus, Loader2, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import type { FoodProduct } from "@/types/food";

export interface IngredientProduct {
  barcode?: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}

interface IngredientSearchProps {
  onSelect: (product: IngredientProduct) => void;
  onClose?: () => void;
}

export function IngredientSearch({ onSelect, onClose }: IngredientSearchProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Keep track of previous results to show while loading
  const previousResultsRef = useRef<FoodProduct[]>([]);

  // Fast search - returns cached or fastest API response
  const {
    data: fastData,
    isLoading: fastLoading,
    isFetching: fastFetching,
  } = trpc.food.searchFast.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000, // Keep fast results for 30s
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
      enabled: debouncedQuery.length >= 2,
      staleTime: 5000,
    }
  );

  // Use full results if available, otherwise fast results
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

  const handleSelect = (product: {
    barcode?: string | null;
    name: string;
    brand?: string | null;
    imageUrl?: string | null;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g?: number;
  }) => {
    // Convert FoodProduct to IngredientProduct (null -> undefined for barcode)
    onSelect({
      barcode: product.barcode ?? undefined,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      caloriesPer100g: product.caloriesPer100g,
      proteinPer100g: product.proteinPer100g,
      carbsPer100g: product.carbsPer100g,
      fatPer100g: product.fatPer100g,
      fiberPer100g: product.fiberPer100g,
    });
    setQuery("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ingredients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-10 bg-card"
            autoFocus
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

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
            {previousResultsRef.current.slice(0, 3).map((product, index) => (
              <div
                key={product.id || index}
                className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 pointer-events-none"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover bg-muted grayscale"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{product.name}</p>
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : isLoading && debouncedQuery.length >= 2 ? (
          // Initial loading state with skeletons
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground animate-pulse">
              Searching for &ldquo;{debouncedQuery}&rdquo;...
            </p>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : displayData?.products && displayData.products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 max-h-60 overflow-y-auto"
          >
            {/* Cache indicator */}
            {isFromCache && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <Zap className="w-3 h-3" />
                <span>Instant results</span>
              </div>
            )}
            {displayData.products.slice(0, 5).map((product: FoodProduct, index: number) => (
              <motion.button
                key={product.id || index}
                type="button"
                onClick={() => handleSelect(product)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 w-full text-left hover:bg-muted/70 active:bg-muted transition-colors"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover bg-muted shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted shrink-0 flex items-center justify-center">
                    {product.dataSource === "USDA" ? (
                      <span className="text-[10px] font-medium text-green-600">USDA</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No img</span>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-xs truncate">{product.name}</p>
                    <DataSourceBadge source={product.dataSource} size="sm" />
                  </div>
                  <p className="text-[10px] text-primary">
                    <EnergyValue kcal={product.caloriesPer100g} toggleable /> / 100g
                  </p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
            {/* Loading indicator for full results */}
            {fullFetching && !fullData && (
              <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                Loading more results...
              </p>
            )}
          </motion.div>
        ) : debouncedQuery.length >= 2 && !isLoading ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center py-4 text-muted-foreground"
          >
            No ingredients found
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
