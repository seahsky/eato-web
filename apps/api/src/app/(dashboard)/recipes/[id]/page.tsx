"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { RecipeLogForm } from "@/components/recipe/recipe-log-form";
import { NutritionPreview } from "@/components/recipe/nutrition-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { ArrowLeft, ChefHat, Edit, Trash2, Plus, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { IngredientData } from "@/components/recipe/ingredient-row";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const recipeId = params.id as string;

  const [mode, setMode] = useState<"view" | "edit" | "log">("view");

  const { data: recipe, isLoading } = trpc.recipe.getById.useQuery(
    { id: recipeId },
    { enabled: !!recipeId }
  );

  const deleteMutation = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      toast.success("Recipe deleted successfully");
      utils.recipe.list.invalidate();
      router.push("/recipes");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete recipe");
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 space-y-4">
        <Link href="/recipes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Recipe not found</p>
        </div>
      </div>
    );
  }

  // Transform ingredients for the form
  const transformedIngredients: IngredientData[] = recipe.ingredients.map((ing: (typeof recipe.ingredients)[number]) => ({
    id: ing.id,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    isPercentage: ing.isPercentage,
    baseIngredientId: ing.baseIngredientId,
    caloriesPer100g: ing.caloriesPer100g,
    proteinPer100g: ing.proteinPer100g,
    carbsPer100g: ing.carbsPer100g,
    fatPer100g: ing.fatPer100g,
    fiberPer100g: ing.fiberPer100g,
    isManualEntry: ing.isManualEntry,
    openFoodFactsId: ing.openFoodFactsId,
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/recipes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-semibold flex-1 truncate">
          {recipe.name}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {mode === "edit" ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setMode("view")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <RecipeForm
              mode="edit"
              initialData={{
                id: recipe.id,
                name: recipe.name,
                description: recipe.description,
                yieldWeight: recipe.yieldWeight,
                yieldUnit: recipe.yieldUnit,
                ingredients: transformedIngredients,
              }}
              onSuccess={() => setMode("view")}
            />
          </motion.div>
        ) : mode === "log" ? (
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
              onClick={() => setMode("view")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <RecipeLogForm
              recipe={recipe}
              onSuccess={() => router.push("/dashboard")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Recipe Info Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{recipe.name}</CardTitle>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>
                        Yield: {recipe.yieldWeight}{recipe.yieldUnit}
                      </span>
                      {!recipe.isOwner && recipe.user?.name && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {recipe.user.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nutrition */}
                <NutritionPreview
                  caloriesPer100g={recipe.caloriesPer100g}
                  proteinPer100g={recipe.proteinPer100g}
                  carbsPer100g={recipe.carbsPer100g}
                  fatPer100g={recipe.fatPer100g}
                  fiberPer100g={recipe.fiberPer100g}
                />

                {/* Ingredients */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Ingredients</h3>
                  <div className="space-y-1.5">
                    {recipe.ingredients.map((ing: IngredientData) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded-lg text-sm"
                      >
                        <span>{ing.name}</span>
                        <span className="text-muted-foreground">
                          {ing.quantity}
                          {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 h-12"
                    onClick={() => setMode("log")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log Portion
                  </Button>

                  {recipe.isOwner && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        onClick={() => setMode("edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: recipe.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
