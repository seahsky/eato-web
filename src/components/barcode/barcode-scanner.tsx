"use client";

import { useEffect, useId } from "react";
import { useBarcodeScanner, type BarcodeError } from "./use-barcode-scanner";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, CameraOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface BarcodeScannerProps {
  isActive: boolean;
  onScan: (barcode: string) => void;
  onError: (error: BarcodeError) => void;
}

export function BarcodeScanner({ isActive, onScan, onError }: BarcodeScannerProps) {
  const scannerId = useId().replace(/:/g, "_");
  const elementId = `barcode-scanner-${scannerId}`;

  const {
    isScanning,
    error,
    startScanning,
    stopScanning,
    hasPermission,
    isInitializing,
  } = useBarcodeScanner();

  useEffect(() => {
    if (isActive) {
      startScanning(elementId, onScan);
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, elementId, onScan, startScanning, stopScanning]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleRetry = () => {
    startScanning(elementId, onScan);
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="relative aspect-[4/3] w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Starting camera...</p>
        </div>
      </div>
    );
  }

  // Permission denied state
  if (error === "PERMISSION_DENIED") {
    return (
      <div className="relative aspect-[4/3] w-full bg-muted rounded-xl overflow-hidden flex items-center justify-center p-6">
        <div className="text-center">
          <CameraOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Camera Access Required</p>
          <p className="text-sm text-muted-foreground mb-4">
            Please enable camera access in your device settings to scan barcodes.
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No camera state
  if (error === "NO_CAMERA") {
    return (
      <div className="relative aspect-[4/3] w-full bg-muted rounded-xl overflow-hidden flex items-center justify-center p-6">
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">No Camera Detected</p>
          <p className="text-sm text-muted-foreground">
            Your device doesn&apos;t appear to have a camera.
          </p>
        </div>
      </div>
    );
  }

  // iOS PWA not supported state
  if (error === "IOS_PWA_NOT_SUPPORTED") {
    return (
      <div className="relative aspect-[4/3] w-full bg-muted rounded-xl overflow-hidden flex items-center justify-center p-6">
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Camera Not Available</p>
          <p className="text-sm text-muted-foreground">
            Camera scanning isn&apos;t supported when the app is installed on your home screen.
            Use manual entry instead, or open Eato in Safari.
          </p>
        </div>
      </div>
    );
  }

  // Scanner error state
  if (error === "SCANNER_ERROR" || error === "NOT_SUPPORTED") {
    return (
      <div className="relative aspect-[4/3] w-full bg-muted rounded-xl overflow-hidden flex items-center justify-center p-6">
        <div className="text-center">
          <CameraOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Scanner Error</p>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to start the barcode scanner.
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full bg-black rounded-xl overflow-hidden">
      {/* Scanner video element */}
      <div id={elementId} className="w-full h-full" />

      {/* Viewfinder overlay */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Semi-transparent background */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Transparent scan area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[280px] h-[120px]">
              {/* Clear cutout */}
              <div className="absolute inset-0 bg-transparent border-2 border-white/80 rounded-lg" />

              {/* Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

              {/* Animated scan line */}
              <motion.div
                className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                initial={{ top: "10%" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
          </div>

          {/* Instruction text */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white text-sm font-medium drop-shadow-lg">
              Point camera at barcode
            </p>
          </div>
        </div>
      )}

      {/* Show placeholder when not scanning */}
      {!isScanning && !error && hasPermission !== false && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm opacity-70">Camera initializing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
