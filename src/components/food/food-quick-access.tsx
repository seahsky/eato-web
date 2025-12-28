"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { trpc } from "@/trpc/react";
import { Clock, Star, TrendingUp, StarOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import type { QuickAccessFood } from "@/types/food";

interface FoodQuickAccessProps {
  onSelect: (food: QuickAccessFood) => void;
}

const TAB_STORAGE_KEY = "eato-quick-access-tab";

export function FoodQuickAccess({ onSelect }: FoodQuickAccessProps) {
  const [activeTab, setActiveTab] = useState<string>("recent");

  // Load persisted tab on mount
  useEffect(() => {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    if (saved && ["recent", "favorites", "frequent"].includes(saved)) {
      setActiveTab(saved);
    }
  }, []);

  // Persist tab selection
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(TAB_STORAGE_KEY, value);
  };

  const utils = trpc.useUtils();

  const { data: recentFoods, isLoading: recentLoading } = trpc.food.getRecentFoods.useQuery();
  const { data: favoriteFoods, isLoading: favoritesLoading } =
    trpc.food.getFavoriteFoods.useQuery();
  const { data: frequentFoods, isLoading: frequentLoading } =
    trpc.food.getFrequentFoods.useQuery();

  const toggleFavorite = trpc.food.toggleFavorite.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await Promise.all([
        utils.food.getRecentFoods.cancel(),
        utils.food.getFavoriteFoods.cancel(),
        utils.food.getFrequentFoods.cancel(),
      ]);

      // Snapshot the previous values
      const previousRecent = utils.food.getRecentFoods.getData();
      const previousFavorites = utils.food.getFavoriteFoods.getData();
      const previousFrequent = utils.food.getFrequentFoods.getData();

      // Find if the food is currently a favorite (by checking any list)
      const isCurrentlyFavorite = [...(previousRecent ?? []), ...(previousFavorites ?? []), ...(previousFrequent ?? [])]
        .find(f => f.name === variables.name && f.brand === variables.brand)?.isFavorite ?? false;

      const newIsFavorite = !isCurrentlyFavorite;

      // Optimistically update recent foods
      utils.food.getRecentFoods.setData(undefined, (old) =>
        old?.map((f) =>
          f.name === variables.name && f.brand === variables.brand
            ? { ...f, isFavorite: newIsFavorite }
            : f
        )
      );

      // Optimistically update favorites
      if (newIsFavorite) {
        // Adding to favorites - find the food and add it
        const foodToAdd = previousRecent?.find(f => f.name === variables.name && f.brand === variables.brand)
          ?? previousFrequent?.find(f => f.name === variables.name && f.brand === variables.brand);
        if (foodToAdd) {
          utils.food.getFavoriteFoods.setData(undefined, (old) => [
            { ...foodToAdd, isFavorite: true },
            ...(old ?? []),
          ]);
        }
      } else {
        // Removing from favorites
        utils.food.getFavoriteFoods.setData(undefined, (old) =>
          old?.filter((f) => !(f.name === variables.name && f.brand === variables.brand))
        );
      }

      // Optimistically update frequent foods
      utils.food.getFrequentFoods.setData(undefined, (old) =>
        old?.map((f) =>
          f.name === variables.name && f.brand === variables.brand
            ? { ...f, isFavorite: newIsFavorite }
            : f
        )
      );

      return { previousRecent, previousFavorites, previousFrequent, newIsFavorite };
    },
    onSuccess: (_result, _variables, context) => {
      toast.success(context?.newIsFavorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousRecent) {
        utils.food.getRecentFoods.setData(undefined, context.previousRecent);
      }
      if (context?.previousFavorites) {
        utils.food.getFavoriteFoods.setData(undefined, context.previousFavorites);
      }
      if (context?.previousFrequent) {
        utils.food.getFrequentFoods.setData(undefined, context.previousFrequent);
      }
      toast.error("Failed to update favorite");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      utils.food.getRecentFoods.invalidate();
      utils.food.getFavoriteFoods.invalidate();
      utils.food.getFrequentFoods.invalidate();
    },
  });

  const handleToggleFavorite = (food: QuickAccessFood, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate({
      name: food.name,
      brand: food.brand,
      imageUrl: food.imageUrl,
      barcode: food.barcode,
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
      fiberPer100g: food.fiberPer100g,
      sugarPer100g: food.sugarPer100g,
      sodiumPer100g: food.sodiumPer100g,
      dataSource: food.dataSource,
      fatSecretId: food.fatSecretId,
      openFoodFactsId: food.barcode,
      usdaFdcId: food.fdcId,
      defaultServingSize: food.defaultServingSize,
      defaultServingUnit: food.defaultServingUnit,
    });
  };

  const favoritesCount = favoriteFoods?.length ?? 0;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-10 mb-3">
        <TabsTrigger value="recent" className="gap-1.5 text-xs">
          <Clock className="w-3.5 h-3.5" />
          Recent
        </TabsTrigger>
        <TabsTrigger value="favorites" className="gap-1.5 text-xs relative">
          <Star className="w-3.5 h-3.5" />
          Favorites
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {favoritesCount > 9 ? "9+" : favoritesCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="frequent" className="gap-1.5 text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          Frequent
        </TabsTrigger>
      </TabsList>

      <AnimatePresence mode="wait">
        <TabsContent value="recent" key="recent">
          <FoodGrid
            foods={recentFoods ?? []}
            isLoading={recentLoading}
            onSelect={onSelect}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage="Start logging to see your recent foods here"
            emptyIcon={<Clock className="w-8 h-8 text-muted-foreground/50" />}
          />
        </TabsContent>

        <TabsContent value="favorites" key="favorites">
          <FoodGrid
            foods={favoriteFoods ?? []}
            isLoading={favoritesLoading}
            onSelect={onSelect}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage="Tap the star on any food to add it here"
            emptyIcon={<Star className="w-8 h-8 text-muted-foreground/50" />}
          />
        </TabsContent>

        <TabsContent value="frequent" key="frequent">
          <FoodGrid
            foods={frequentFoods ?? []}
            isLoading={frequentLoading}
            onSelect={onSelect}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage="Foods you log often will appear here"
            emptyIcon={<TrendingUp className="w-8 h-8 text-muted-foreground/50" />}
            showCount
          />
        </TabsContent>
      </AnimatePresence>
    </Tabs>
  );
}

interface FoodGridProps {
  foods: QuickAccessFood[];
  isLoading: boolean;
  onSelect: (food: QuickAccessFood) => void;
  onToggleFavorite: (food: QuickAccessFood, e: React.MouseEvent) => void;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
  showCount?: boolean;
}

function FoodGrid({
  foods,
  isLoading,
  onSelect,
  onToggleFavorite,
  emptyMessage,
  emptyIcon,
  showCount,
}: FoodGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        {emptyIcon}
        <p className="text-sm text-muted-foreground mt-2">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-3 gap-2"
    >
      {foods.map((food, index) => (
        <motion.button
          key={food.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onSelect(food)}
          className="relative bg-card rounded-xl p-2.5 border border-border/50 text-left hover:bg-accent/50 transition-colors group"
        >
          {/* Favorite toggle */}
          <button
            onClick={(e) => onToggleFavorite(food, e)}
            className="absolute top-1.5 right-1.5 p-1 rounded-full hover:bg-background/80 transition-colors z-10"
            title={food.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {food.isFavorite ? (
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {/* Food image or placeholder */}
          {food.imageUrl ? (
            <img
              src={food.imageUrl}
              alt={food.name}
              className="w-full h-12 rounded-lg object-cover bg-muted mb-1.5"
            />
          ) : (
            <div className="w-full h-12 rounded-lg bg-muted flex items-center justify-center mb-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                {food.dataSource === "FATSECRET" ? "FS" : food.dataSource === "USDA" ? "USDA" : food.dataSource === "OPEN_FOOD_FACTS" ? "OFF" : ""}
              </span>
            </div>
          )}

          {/* Food name and badge */}
          <div className="flex items-center gap-1 pr-4">
            <p className="text-xs font-medium truncate">{food.name}</p>
            <DataSourceBadge source={food.dataSource} size="sm" />
          </div>

          {/* Calories */}
          <p className="text-[10px] text-primary font-medium">
            <EnergyValue kcal={food.caloriesPer100g} toggleable /> /100g
          </p>

          {/* Log count badge for frequent tab */}
          {showCount && food.logCount && (
            <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-muted px-1.5 py-0.5 rounded-full">
              {food.logCount}x
            </span>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}
