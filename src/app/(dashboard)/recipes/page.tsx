"use client";

import { useState } from "react";
import { RecipeList } from "@/components/recipe/recipe-list";
import { RecipeLogForm } from "@/components/recipe/recipe-log-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

export default function RecipesPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [mode, setMode] = useState<"list" | "log">("list");

  const handleRecipeLog = (recipe: Recipe) => {
    setSelectedRecipe(recipe as Recipe);
    setMode("log");
  };

  const handleBack = () => {
    setSelectedRecipe(null);
    setMode("list");
  };

  const handleLogSuccess = () => {
    setSelectedRecipe(null);
    setMode("list");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Recipes</h1>

      <AnimatePresence mode="wait">
        {mode === "log" && selectedRecipe ? (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <RecipeLogForm
              recipe={selectedRecipe}
              onSuccess={handleLogSuccess}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <RecipeList
              onLog={handleRecipeLog}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
