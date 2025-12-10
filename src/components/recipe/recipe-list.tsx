"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeCard } from "./recipe-card";
import { trpc } from "@/trpc/react";
import { Search, Plus, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";

interface Recipe {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  yieldWeight: number;
  yieldUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  user?: { name: string | null };
}

interface RecipeListProps {
  onSelect?: (recipe: Recipe) => void;
  onLog?: (recipe: Recipe) => void;
  showCreateButton?: boolean;
}

export function RecipeList({
  onSelect,
  onLog,
  showCreateButton = true,
}: RecipeListProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("mine");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = trpc.recipe.list.useQuery();

  // Filter recipes by search query
  const filterRecipes = (recipes: Recipe[]) => {
    if (!debouncedQuery) return recipes;
    return recipes.filter((r) =>
      r.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  };

  const userRecipes = filterRecipes(data?.userRecipes ?? []);
  const partnerRecipes = filterRecipes(data?.partnerRecipes ?? []);
  const hasPartner = (data?.partnerRecipes ?? []).length > 0;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 bg-card"
        />
      </div>

      {/* Create Button */}
      {showCreateButton && (
        <Link href="/recipes/new">
          <Button variant="outline" className="w-full h-12">
            <Plus className="w-4 h-4 mr-2" />
            Create New Recipe
          </Button>
        </Link>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : hasPartner ? (
        /* Tabs for user/partner recipes */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="mine">My Recipes</TabsTrigger>
            <TabsTrigger value="partner">Partner's</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-0">
            <RecipeGrid
              recipes={userRecipes}
              isOwner={true}
              onSelect={onSelect}
              onLog={onLog}
              emptyMessage="You haven't created any recipes yet"
            />
          </TabsContent>

          <TabsContent value="partner" className="mt-0">
            <RecipeGrid
              recipes={partnerRecipes}
              isOwner={false}
              onSelect={onSelect}
              onLog={onLog}
              emptyMessage="Your partner hasn't created any recipes yet"
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* No tabs - just show user recipes */
        <RecipeGrid
          recipes={userRecipes}
          isOwner={true}
          onSelect={onSelect}
          onLog={onLog}
          emptyMessage="You haven't created any recipes yet"
        />
      )}
    </div>
  );
}

function RecipeGrid({
  recipes,
  isOwner,
  onSelect,
  onLog,
  emptyMessage,
}: {
  recipes: Recipe[];
  isOwner: boolean;
  onSelect?: (recipe: Recipe) => void;
  onLog?: (recipe: Recipe) => void;
  emptyMessage: string;
}) {
  if (recipes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-muted-foreground"
      >
        <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
        {isOwner && (
          <Link href="/recipes/new">
            <Button variant="link" size="sm" className="mt-2">
              Create your first recipe
            </Button>
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-3"
      >
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isOwner={isOwner}
            partnerName={recipe.user?.name}
            onSelect={onSelect ? () => onSelect(recipe) : undefined}
            onLog={onLog ? () => onLog(recipe) : undefined}
            index={index}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
