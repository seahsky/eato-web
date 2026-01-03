"use client";

import { motion } from "framer-motion";
import { trpc } from "@/trpc/react";
import { RecipeMiniCard } from "./recipe-mini-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChefHat, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RecentRecipesProps {
  className?: string;
}

export function RecentRecipes({ className }: RecentRecipesProps) {
  const router = useRouter();
  const { data: recipes, isLoading } = trpc.recipe.getRecent.useQuery({ limit: 5 });

  // Don't render if no recipes or loading
  if (isLoading || !recipes || recipes.length === 0) {
    return null;
  }

  const handleQuickLog = (recipeId: string) => {
    // Navigate to log page with recipe pre-selected
    router.push(`/log?tab=recipes&recipeId=${recipeId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Quick Recipes
          </h2>
        </div>
        <Link
          href="/log?tab=recipes"
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Horizontal scroll carousel */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {recipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <RecipeMiniCard
                recipe={recipe}
                onQuickLog={handleQuickLog}
              />
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  );
}
