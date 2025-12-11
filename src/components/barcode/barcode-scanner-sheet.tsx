"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { BarcodeScanner } from "./barcode-scanner";
import { BarcodeManualInput } from "./barcode-manual-input";
import { trpc } from "@/trpc/react";
import { Camera, Keyboard, Plus, Search, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { FoodProduct } from "@/types/food";
import type { BarcodeError } from "./use-barcode-scanner";

interface BarcodeScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (product: FoodProduct) => void;
}

type InputMode = "camera" | "manual";
type SheetState = "idle" | "scanning" | "loading" | "found" | "not_found" | "error";

export function BarcodeScannerSheet({
  open,
  onOpenChange,
  onProductFound,
}: BarcodeScannerSheetProps) {
  const [inputMode, setInputMode] = useState<InputMode>("camera");
  const [sheetState, setSheetState] = useState<SheetState>("idle");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<BarcodeError | null>(null);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setSheetState("idle");
      setScannedBarcode(null);
      setCameraError(null);
    }
  }, [open]);

  // Query for barcode lookup
  const {
    data: product,
    isLoading: isLookingUp,
    error: lookupError,
    refetch,
  } = trpc.food.getByBarcode.useQuery(
    { barcode: scannedBarcode! },
    {
      enabled: !!scannedBarcode,
      retry: false,
    }
  );

  // Handle lookup results
  useEffect(() => {
    if (isLookingUp) {
      setSheetState("loading");
    } else if (lookupError) {
      if (lookupError.data?.code === "NOT_FOUND") {
        setSheetState("not_found");
      } else {
        setSheetState("error");
        toast.error("Failed to look up product");
      }
    } else if (product) {
      setSheetState("found");
    }
  }, [isLookingUp, lookupError, product]);

  const handleScan = useCallback((barcode: string) => {
    setScannedBarcode(barcode);
  }, []);

  const handleCameraError = useCallback((error: BarcodeError) => {
    setCameraError(error);
    // Auto-switch to manual mode on camera errors
    if (error === "PERMISSION_DENIED" || error === "NO_CAMERA" || error === "NOT_SUPPORTED") {
      setInputMode("manual");
    }
  }, []);

  const handleManualSubmit = (barcode: string) => {
    setScannedBarcode(barcode);
  };

  const handleRetry = () => {
    setScannedBarcode(null);
    setSheetState("idle");
    refetch();
  };

  const handleAddProduct = () => {
    if (product) {
      onProductFound(product);
    }
  };

  const handleSwitchToSearch = () => {
    onOpenChange(false);
    toast.info("Try searching by name instead");
  };

  const isCameraActive = open && inputMode === "camera" && sheetState === "idle";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl flex flex-col"
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Scan Barcode</SheetTitle>
          <SheetDescription>
            Scan a product barcode or enter it manually
          </SheetDescription>
        </SheetHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={inputMode === "camera" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("camera")}
            disabled={cameraError === "NO_CAMERA" || cameraError === "NOT_SUPPORTED"}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={inputMode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("manual")}
            className="flex-1"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Manual
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Camera mode */}
            {inputMode === "camera" && sheetState === "idle" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BarcodeScanner
                  isActive={isCameraActive}
                  onScan={handleScan}
                  onError={handleCameraError}
                />
              </motion.div>
            )}

            {/* Manual mode */}
            {inputMode === "manual" && sheetState === "idle" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BarcodeManualInput
                  onSubmit={handleManualSubmit}
                  isLoading={isLookingUp}
                />
              </motion.div>
            )}

            {/* Loading state */}
            {sheetState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Looking up barcode: {scannedBarcode}
                </p>
                <Skeleton className="h-20 rounded-xl" />
              </motion.div>
            )}

            {/* Product found */}
            {sheetState === "found" && product && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex gap-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover bg-muted"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base truncate">{product.name}</h3>
                      {product.brand && (
                        <p className="text-sm text-muted-foreground truncate">
                          {product.brand}
                        </p>
                      )}
                      <p className="text-sm text-primary font-medium mt-1">
                        <EnergyValue kcal={product.caloriesPer100g} toggleable /> / 100g
                      </p>
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        OFF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Scan Another
                  </Button>
                  <Button onClick={handleAddProduct} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Food
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Product not found */}
            {sheetState === "not_found" && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">Product Not Found</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Barcode: {scannedBarcode}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  This product isn&apos;t in the Open Food Facts database yet.
                </p>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Scan Again
                  </Button>
                  <Button variant="ghost" onClick={handleSwitchToSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Search by Name Instead
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Error state */}
            {sheetState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
                <h3 className="font-medium mb-1">Something Went Wrong</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Unable to look up the product. Please try again.
                </p>

                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
