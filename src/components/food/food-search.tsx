"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { BarcodeScannerSheet } from "@/components/barcode";
import { FoodQuickAccess } from "./food-quick-access";
import { QuickEnergyForm } from "./quick-energy-form";
import { trpc } from "@/trpc/react";
import { Search, Plus, Loader2, ScanBarcode, Zap, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import type { FoodProduct, QuickAccessFood } from "@/types/food";

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    zh: "Chinese",
    "zh-CN": "Chinese",
    "zh-TW": "Chinese",
    ja: "Japanese",
    ko: "Korean",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    it: "Italian",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    th: "Thai",
    vi: "Vietnamese",
    id: "Indonesian",
    ms: "Malay",
    tl: "Filipino",
  };
  return languages[code] || code.toUpperCase();
}

interface FoodSearchProps {
  onSelect: (product: FoodProduct) => void;
  defaultMealType?: string;
}

export function FoodSearch({ onSelect, defaultMealType = "LUNCH" }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
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

  // Get translation info if query was translated
  const translationInfo = displayData?.translationInfo;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
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
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => setScannerOpen(true)}
          title="Scan barcode"
        >
          <ScanBarcode className="w-5 h-5" />
        </Button>
      </div>

      <BarcodeScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onProductFound={(product) => {
          setScannerOpen(false);
          onSelect(product);
        }}
      />

      <AnimatePresence mode="wait">
        {/* Show quick-access when not searching */}
        {!query ? (
          <motion.div
            key="quick-access"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <QuickEnergyForm defaultMealType={defaultMealType} />
            <FoodQuickAccess onSelect={(food) => onSelect(food as FoodProduct)} />
          </motion.div>
        ) : showPreviousResults ? (
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
                className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3 pointer-events-none"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-14 h-14 rounded-lg object-cover bg-muted grayscale"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">...</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : isLoading && debouncedQuery.length >= 2 ? (
          // Initial loading state with skeletons
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground animate-pulse">
              Searching for &ldquo;{debouncedQuery}&rdquo;...
            </p>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : displayData?.products && displayData.products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {/* Cache and translation indicators */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {isFromCache && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-3 h-3" />
                  <span>Instant results</span>
                </div>
              )}
              {translationInfo && (
                <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                  <Globe className="w-3 h-3" />
                  <span>
                    Translated: &ldquo;{translationInfo.originalQuery}&rdquo; →
                    &ldquo;{translationInfo.translatedQuery}&rdquo;
                    <span className="text-muted-foreground ml-1">
                      ({getLanguageName(translationInfo.detectedLanguage)})
                    </span>
                  </span>
                </div>
              )}
            </div>
            {displayData.products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
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
                    <span className="text-xs text-muted-foreground">No img</span>
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
                    <DataSourceBadge source={product.dataSource} size="sm" />
                  </div>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    <EnergyValue kcal={product.caloriesPer100g} toggleable /> / 100g
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
            {/* Loading indicator for full results */}
            {fullFetching && !fullData && (
              <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                Loading more results...
              </p>
            )}
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
