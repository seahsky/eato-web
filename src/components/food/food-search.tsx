"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { trpc } from "@/trpc/react";
import { Search, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import type { FoodProduct } from "@/types/food";

interface FoodSearchProps {
  onSelect: (product: FoodProduct) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, isFetching } = trpc.food.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search foods..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 bg-card"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading && debouncedQuery.length >= 2 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : data?.products && data.products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {data.products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-14 h-14 rounded-lg object-cover bg-muted"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                    {product.dataSource === "USDA" ? (
                      <span className="text-[10px] font-medium text-green-600">USDA</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No img</span>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {product.brand && (
                      <span className="text-xs text-muted-foreground truncate">
                        {product.brand}
                      </span>
                    )}
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        product.dataSource === "USDA"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {product.dataSource === "USDA" ? "USDA" : "OFF"}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    <EnergyValue kcal={product.caloriesPer100g} /> / 100g
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shrink-0"
                  onClick={() => onSelect(product)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        ) : debouncedQuery.length >= 2 && !isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <p className="text-sm">No results found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
