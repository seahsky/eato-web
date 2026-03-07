"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import type { FoodProduct } from "@/types/food";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eato-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = trpc.food.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const results: FoodProduct[] = data?.products ?? [];

  const addToRecent = useCallback(
    (q: string) => {
      const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("eato-recent-searches", JSON.stringify(updated));
    },
    [recentSearches]
  );

  function selectProduct(product: (typeof results)[0]) {
    if (debouncedQuery) addToRecent(debouncedQuery);
    router.push(`/add?product=${encodeURIComponent(JSON.stringify(product))}`);
  }

  function searchFromRecent(q: string) {
    setQuery(q);
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <div className="py-3">
        <h1 className="mb-2 font-caveat text-xl">What did you eat?</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="e.g., chicken breast 150g, rice 200g"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((product, i) => (
            <div key={product.id} className={i < 5 ? `animate-fade-in-delay-${i}` : "animate-fade-in-delay-4"}>
            <Card
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => selectProduct(product)}
            >
              <CardContent className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {product.brand ? `${product.brand} · ` : ""}
                    {Math.round(product.caloriesPer100g)} kcal/100g
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {product.servingSize}{product.servingUnit}
                </span>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Hmm, I couldn&apos;t find &ldquo;{debouncedQuery}&rdquo;. Try describing it differently?
          </p>
          {data?.sources?.fatsecret?.error && (
            <p className="text-xs text-destructive">
              Search unavailable: {data.sources.fatsecret.error}
            </p>
          )}
          <Button size="sm" onClick={() => router.push("/add")}>
            Describe it yourself
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3 text-sm text-destructive">
            {error.message}
          </CardContent>
        </Card>
      )}

      {/* Recent searches */}
      {!query && recentSearches.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
            Recent searches
          </h3>
          <div className="space-y-1">
            {recentSearches.map((recent) => (
              <button
                key={recent}
                className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-sm hover:bg-accent"
                onClick={() => searchFromRecent(recent)}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                {recent}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
