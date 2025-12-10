"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";

interface BarcodeManualInputProps {
  onSubmit: (barcode: string) => void;
  isLoading: boolean;
}

export function BarcodeManualInput({ onSubmit, isLoading }: BarcodeManualInputProps) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateBarcode = (value: string): boolean => {
    // Remove any whitespace
    const cleaned = value.trim();

    // Check if numeric only
    if (!/^\d+$/.test(cleaned)) {
      setError("Barcode must contain only numbers");
      return false;
    }

    // Check length (EAN-8: 8, EAN-13: 13, UPC-A: 12, UPC-E: 6-8)
    if (cleaned.length < 6 || cleaned.length > 13) {
      setError("Barcode must be 6-13 digits");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = barcode.trim();

    if (!cleaned) {
      setError("Please enter a barcode");
      return;
    }

    if (validateBarcode(cleaned)) {
      onSubmit(cleaned);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits
    const numericValue = value.replace(/\D/g, "");
    setBarcode(numericValue);

    // Clear error when typing
    if (error) {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="barcode-input">Enter Barcode Number</Label>
        <div className="relative">
          <Input
            id="barcode-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g., 3017620422003"
            value={barcode}
            onChange={handleChange}
            maxLength={13}
            disabled={isLoading}
            className={error ? "border-destructive" : ""}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Enter the barcode number from the product packaging (usually 8-13 digits)
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!barcode.trim() || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Looking up...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Look Up Product
          </>
        )}
      </Button>
    </form>
  );
}
