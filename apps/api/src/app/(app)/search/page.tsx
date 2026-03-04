"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";

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

  const results = (data?.foods ?? []) as Array<{
    id: string;
    name: string;
    brand?: string;
    caloriesPer100g: number;
    servingSize: number;
    servingUnit: string;
  }>;

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search food..."
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
          {results.map((product) => (
            <Card
              key={product.id}
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
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No results for &ldquo;{debouncedQuery}&rdquo;
          </p>
          <Button size="sm" onClick={() => router.push("/add")}>
            Add Manually
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
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-muted-foreground">
            Recent Searches
          </h3>
          <div className="space-y-1">
            {recentSearches.map((recent) => (
              <button
                key={recent}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
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
