"use client";

import { useSearchParams } from "next/navigation";
import { FoodEntryForm } from "@/components/food/food-entry-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodSearch } from "@/components/food/food-search";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FoodProduct {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  servingSize: number;
  servingUnit: string;
}

function LogPageContent() {
  const searchParams = useSearchParams();
  const mealParam = searchParams.get("meal")?.toUpperCase() ?? "LUNCH";
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  const handleProductSelect = (product: FoodProduct) => {
    setSelectedProduct(product);
  };

  const handleSuccess = () => {
    setSelectedProduct(null);
    setActiveTab("search");
  };

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
              onClick={() => setSelectedProduct(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <FoodEntryForm
              product={selectedProduct}
              defaultMealType={mealParam}
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
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="quick">Quick Add</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="mt-0">
                <FoodSearch onSelect={handleProductSelect} />
              </TabsContent>

              <TabsContent value="quick" className="mt-0">
                <FoodEntryForm
                  defaultMealType={mealParam}
                  onSuccess={handleSuccess}
                />
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
