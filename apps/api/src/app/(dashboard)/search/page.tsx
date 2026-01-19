"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FoodSearch } from "@/components/food/food-search";
import { FoodEntryForm } from "@/components/food/food-entry-form";
import { BarcodeScannerSheet } from "@/components/barcode/barcode-scanner-sheet";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodProduct } from "@/types/food";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Check for scanned product from FAB menu barcode scanner
  useEffect(() => {
    if (searchParams.get("from") === "scan") {
      const storedProduct = sessionStorage.getItem("scannedProduct");
      if (storedProduct) {
        try {
          const product = JSON.parse(storedProduct) as FoodProduct;
          setSelectedProduct(product);
          sessionStorage.removeItem("scannedProduct");
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, [searchParams]);

  const handleBarcodeProductFound = (product: FoodProduct) => {
    setScannerOpen(false);
    setSelectedProduct(product);
  };

  return (
    <div className="p-4 space-y-4">
      <AnimatePresence mode="wait">
        {selectedProduct ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setSelectedProduct(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to search
            </Button>
            <FoodEntryForm
              product={selectedProduct}
              onSuccess={() => setSelectedProduct(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h1 className="text-2xl font-serif font-semibold mb-4">
              Search Foods
            </h1>
            <FoodSearch onSelect={setSelectedProduct} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Barcode Scanner Button */}
      {!selectedProduct && (
        <motion.div
          className="fixed bottom-24 right-4 z-40"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg shadow-primary/30"
            onClick={() => setScannerOpen(true)}
            aria-label="Scan barcode"
          >
            <ScanBarcode className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Barcode Scanner Sheet */}
      <BarcodeScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onProductFound={handleBarcodeProductFound}
      />
    </div>
  );
}
