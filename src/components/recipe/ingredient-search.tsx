"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { trpc } from "@/trpc/react";
import { Search, Plus, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";

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

  const { data, isLoading, isFetching } = trpc.food.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

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
        {isLoading && debouncedQuery.length >= 2 ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : data?.products && data.products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 max-h-60 overflow-y-auto"
          >
            {data.products.slice(0, 5).map((product, index) => (
              <motion.div
                key={product.barcode || index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-muted/50 rounded-lg p-2 flex items-center gap-2"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{product.name}</p>
                  <p className="text-[10px] text-primary">
                    <EnergyValue kcal={product.caloriesPer100g} /> / 100g
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-full shrink-0 h-8 w-8"
                  onClick={() => handleSelect(product)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
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
