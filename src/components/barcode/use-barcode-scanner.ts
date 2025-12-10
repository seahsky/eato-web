"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export type BarcodeError =
  | "PERMISSION_DENIED"
  | "NO_CAMERA"
  | "SCANNER_ERROR"
  | "NOT_SUPPORTED";

interface UseBarcodeScanner {
  isScanning: boolean;
  error: BarcodeError | null;
  startScanning: (elementId: string, onScan: (barcode: string) => void) => Promise<void>;
  stopScanning: () => Promise<void>;
  hasPermission: boolean | null;
  isInitializing: boolean;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
];

export function useBarcodeScanner(): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<BarcodeError | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    lastScanRef.current = null;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const startScanning = useCallback(
    async (elementId: string, onScan: (barcode: string) => void) => {
      setError(null);
      setIsInitializing(true);

      // Clean up any existing scanner
      await stopScanning();

      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("NOT_SUPPORTED");
          setIsInitializing(false);
          return;
        }

        // Check for cameras
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError("NO_CAMERA");
          setHasPermission(false);
          setIsInitializing(false);
          return;
        }

        setHasPermission(true);

        // Create scanner instance
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
        });
        scannerRef.current = scanner;

        // Start scanning
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            // Debounce duplicate scans
            if (lastScanRef.current === decodedText) {
              return;
            }
            lastScanRef.current = decodedText;

            // Reset after 2 seconds to allow rescanning same code
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
            }
            scanTimeoutRef.current = setTimeout(() => {
              lastScanRef.current = null;
            }, 2000);

            onScan(decodedText);
          },
          () => {
            // Scan error (no barcode found in frame) - ignore
          }
        );

        setIsScanning(true);
        setIsInitializing(false);
      } catch (err) {
        setIsInitializing(false);

        const errorMessage = err instanceof Error ? err.message : String(err);

        if (
          errorMessage.includes("Permission") ||
          errorMessage.includes("NotAllowedError")
        ) {
          setError("PERMISSION_DENIED");
          setHasPermission(false);
        } else if (
          errorMessage.includes("NotFoundError") ||
          errorMessage.includes("camera")
        ) {
          setError("NO_CAMERA");
        } else {
          setError("SCANNER_ERROR");
        }
      }
    },
    [stopScanning]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
    hasPermission,
    isInitializing,
  };
}
