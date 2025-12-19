"use client";

import { useSearchParams } from "next/navigation";
import { FoodEntryForm } from "@/components/food/food-entry-form";
import { MealCalculator } from "@/components/food/meal-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodSearch } from "@/components/food/food-search";
import { RecipeList } from "@/components/recipe/recipe-list";
import { RecipeLogForm } from "@/components/recipe/recipe-log-form";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodProduct } from "@/types/food";

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

function LogPageContent() {
  const searchParams = useSearchParams();
  const mealParam = searchParams.get("meal")?.toUpperCase() ?? "LUNCH";
  const dateParam = searchParams.get("date") ?? undefined;
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  const handleProductSelect = (product: FoodProduct) => {
    setSelectedProduct(product);
  };

  const handleRecipeLog = (recipe: Recipe) => {
    setSelectedRecipe(recipe as Recipe);
  };

  const handleSuccess = () => {
    setSelectedProduct(null);
    setSelectedRecipe(null);
    setActiveTab("search");
  };

  const handleBack = () => {
    setSelectedProduct(null);
    setSelectedRecipe(null);
  };

  // Show recipe log form if a recipe is selected
  if (selectedRecipe) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-serif font-semibold">Add Food</h1>
        <motion.div
          key="recipe-form"
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
            defaultMealType={mealParam}
            date={dateParam}
            onSuccess={handleSuccess}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Add Food</h1>

      <AnimatePresence mode="wait">
        {selectedProduct ? (
          <motion.div
            key="form"
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
            <FoodEntryForm
              product={selectedProduct}
              defaultMealType={mealParam}
              date={dateParam}
              onSuccess={handleSuccess}
            />
          </motion.div>
        ) : (
          <motion.div
            key="tabs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="recipes">Recipes</TabsTrigger>
                <TabsTrigger value="meal">Meal Calc</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="mt-0">
                <FoodSearch onSelect={handleProductSelect} defaultMealType={mealParam} />
              </TabsContent>

              <TabsContent value="recipes" className="mt-0">
                <RecipeList
                  onLog={handleRecipeLog}
                  showCreateButton={true}
                />
              </TabsContent>

              <TabsContent value="meal" className="mt-0">
                <MealCalculator />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <LogPageContent />
    </Suspense>
  );
}
