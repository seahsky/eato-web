"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, X, RotateCcw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePetReaction } from "@/components/app/pixel-pet/pet-reaction-provider";
import { MOOD_OPTIONS } from "@/lib/constants";
import { parseIngredientLines } from "@/lib/meal-parser";
import { compressImage } from "@/lib/image-utils";
import type { FoodProduct } from "@/types/food";

interface ReviewItem {
  id: string;
  rawLine: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  normalizedGrams: number;
  isDirectEnergy?: boolean;
  directCalories?: number;
  parseError?: string;
  matchedProduct?: FoodProduct | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
}

type Stage = "photo" | "choose" | "input" | "review" | "saving";

export default function LogPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { triggerReaction } = usePetReaction();

  const [stage, setStage] = useState<Stage>("photo");
  const [text, setText] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mealGroupId = useMemo(() => crypto.randomUUID(), []);

  const batchLog = trpc.food.batchLog.useMutation();
  const analyzePhoto = trpc.food.analyzePhoto.useMutation();
  const uploadPhoto = trpc.food.uploadPhoto.useMutation();

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (stage !== "photo" || cameraUnavailable) return;

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) setCameraUnavailable(true);
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stage, cameraUnavailable, stopStream]);

  function handleShutterPress() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");

    stopStream();
    setCapturedImage(base64);
    setStage("choose");

    // Upload in background
    setIsUploading(true);
    uploadPhoto
      .mutateAsync({ image: base64, mealGroupId })
      .then((result) => setPhotoUrl(result.url))
      .catch(() => toast.error("Photo upload failed — food will be logged without photo"))
      .finally(() => setIsUploading(false));
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const base64 = await compressImage(file);
      setCapturedImage(base64);
      setStage("choose");

      // Upload in background
      setIsUploading(true);
      uploadPhoto
        .mutateAsync({ image: base64, mealGroupId })
        .then((result) => setPhotoUrl(result.url))
        .catch(() => toast.error("Photo upload failed — food will be logged without photo"))
        .finally(() => setIsUploading(false));
    } catch {
      toast.error("Failed to process photo. Please try again.");
    }
  }

  async function handleAIRecognition() {
    if (!capturedImage) return;
    setIsAnalyzingPhoto(true);

    try {
      const results = await analyzePhoto.mutateAsync({ image: capturedImage });

      if (!results || results.length === 0) {
        toast.error("No food items detected. Try again or log manually.");
        return;
      }

      const items: ReviewItem[] = results.map((r: ReviewItem) => ({
        id: r.id,
        rawLine: r.ingredientName,
        ingredientName: r.ingredientName,
        quantity: r.normalizedGrams,
        unit: "g",
        normalizedGrams: r.normalizedGrams,
        matchedProduct: r.matchedProduct,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        servingSize: r.servingSize,
        servingUnit: r.servingUnit,
      }));

      setReviewItems(items);
      setStage("review");
    } catch {
      toast.error("Failed to analyze photo. Please try again.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  }

  async function handleCalculate() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const parsed = parseIngredientLines(trimmed);
    if (parsed.length === 0) {
      toast.error("No valid items found. Use format: 200g chicken breast");
      return;
    }

    if (parsed.length > 15) {
      toast.error("Maximum 15 items per batch");
      return;
    }

    setIsSearching(true);

    const queries = parsed
      .filter((p) => !p.parseError && !p.isDirectEnergy)
      .map((p) => ({
        id: p.id,
        query: p.ingredientName,
      }));

    try {
      let searchResults: Array<{
        id: string;
        query: string;
        products: FoodProduct[];
      }> = [];

      if (queries.length > 0) {
        const result = await utils.client.food.batchSearch.query({
          queries,
        });
        searchResults = result as typeof searchResults;
      }

      const items: ReviewItem[] = parsed.map((p) => {
        if (p.parseError) {
          return {
            ...p,
            matchedProduct: null,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            servingSize: p.normalizedGrams,
            servingUnit: "g",
          };
        }

        if (p.isDirectEnergy) {
          return {
            ...p,
            matchedProduct: null,
            calories: p.directCalories ?? 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            servingSize: 1,
            servingUnit: "serving",
          };
        }

        const match = searchResults.find((r) => r.id === p.id);
        const product = match?.products?.[0] ?? null;

        if (product) {
          const factor = p.normalizedGrams / 100;
          return {
            ...p,
            matchedProduct: product,
            calories: Math.round(product.caloriesPer100g * factor),
            protein: Math.round((product.proteinPer100g ?? 0) * factor * 10) / 10,
            carbs: Math.round((product.carbsPer100g ?? 0) * factor * 10) / 10,
            fat: Math.round((product.fatPer100g ?? 0) * factor * 10) / 10,
            servingSize: p.normalizedGrams,
            servingUnit: "g",
          };
        }

        return {
          ...p,
          matchedProduct: null,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          servingSize: p.normalizedGrams,
          servingUnit: "g",
        };
      });

      setReviewItems(items.filter((i) => !i.parseError));
      setStage("review");
    } catch {
      toast.error("Failed to look up nutrition data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function removeItem(id: string) {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setReviewItems((items) => items.filter((i) => i.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 250);
  }

  function updateQuantity(id: string, newSize: number) {
    setReviewItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (item.isDirectEnergy) return item;

        const product = item.matchedProduct;
        if (!product) return { ...item, servingSize: newSize };

        const factor = newSize / 100;
        return {
          ...item,
          servingSize: newSize,
          normalizedGrams: newSize,
          calories: Math.round(product.caloriesPer100g * factor),
          protein: Math.round((product.proteinPer100g ?? 0) * factor * 10) / 10,
          carbs: Math.round((product.carbsPer100g ?? 0) * factor * 10) / 10,
          fat: Math.round((product.fatPer100g ?? 0) * factor * 10) / 10,
        };
      })
    );
  }

  const totalCalories = reviewItems.reduce((sum, i) => sum + i.calories, 0);

  async function handleLogAll() {
    if (reviewItems.length === 0) return;

    // Wait for upload if still in progress
    if (isUploading) {
      toast.info("Uploading photo...");
      return;
    }

    setStage("saving");
    const consumedAt = format(new Date(), "yyyy-MM-dd");

    try {
      await batchLog.mutateAsync({
        mealGroupId,
        consumedAt,
        entries: reviewItems.map((item) => ({
          name: item.matchedProduct?.name ?? item.ingredientName,
          brand: item.matchedProduct?.brand ?? null,
          calories: item.calories,
          protein: item.protein || undefined,
          carbs: item.carbs || undefined,
          fat: item.fat || undefined,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
          imageUrl: photoUrl ?? undefined,
          mealGroupId,
          consumedAt,
          mood: selectedMood ?? undefined,
          note: note || undefined,
          dataSource: (item.matchedProduct?.dataSource as "FATSECRET" | "MANUAL") ?? "MANUAL",
          fatSecretId: item.matchedProduct?.fatSecretId ?? undefined,
          isManualEntry: !item.matchedProduct,
        })),
      });
      triggerReaction("food_logged");
      utils.stats.getDailySummary.invalidate();
      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to log food. Please try again."
      );
      setStage("review");
    }
  }

  function handleRetake() {
    setCapturedImage(null);
    setPhotoUrl(null);
    setCameraUnavailable(false);
    setStage("photo");
  }

  const headerText =
    stage === "review" || stage === "saving"
      ? "Review your meal"
      : "What did you eat?";

  return (
    <div className="mx-auto max-w-lg px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <Link href="/dashboard" aria-label="Back to diary" className="flex items-center justify-center min-h-[44px] min-w-[44px]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-caveat text-xl">{headerText}</h1>
      </div>

      {/* Stage: Photo capture — viewfinder or fallback */}
      {stage === "photo" && (
        <div className="flex flex-col items-center animate-fade-in">
          {!cameraUnavailable ? (
            <>
              <div className="-mx-4 relative w-full overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Camera viewfinder"
                  className="h-[calc(100dvh-5rem)] max-h-[70vh] landscape:max-h-[60vh] w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Take photo"
                  className="absolute bottom-8 left-1/2 flex h-18 w-18 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-lg transition-transform active:scale-90"
                  onClick={handleShutterPress}
                >
                  <div className="h-14 w-14 rounded-full bg-white" />
                </button>
                <button
                  type="button"
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 min-h-[44px] px-4 py-3 text-sm text-white/70 underline underline-offset-2 hover:text-white bg-black/30 backdrop-blur-sm rounded-full"
                  onClick={() => setStage("input")}
                >
                  Skip, log manually
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <button
                type="button"
                className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-10 w-10" />
              </button>
              <p className="text-sm text-muted-foreground">
                Take a photo of your meal
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              <button
                type="button"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => setStage("input")}
              >
                Skip, log manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage: Choose — AI or manual */}
      {stage === "choose" && (
        <div className="space-y-4 animate-fade-in">
          {capturedImage && (
            <div className="overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${capturedImage}`}
                alt="Captured meal"
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          {isAnalyzingPhoto ? (
            <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Analyzing your meal...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" onClick={handleAIRecognition}>
                Use AI Recognition
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStage("input")}
              >
                Log Manually
              </Button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={handleRetake}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retake
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage: Manual input */}
      {stage === "input" && (
        <div className="space-y-4 animate-fade-in">
          <textarea
            aria-label="Food items to log"
            className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50"
            rows={6}
            placeholder={"200g chicken breast\n100g rice\n2 eggs\n352kj canned salmon"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            One item per line. Format: quantity + unit + food name (e.g. 200g chicken breast)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                capturedImage ? setStage("choose") : setStage("photo")
              }
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!text.trim() || isSearching}
              onClick={handleCalculate}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up nutrition...
                </>
              ) : (
                "Calculate"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Stage: Review */}
      {stage === "review" && (
        <div className="space-y-3 animate-fade-in">
          {reviewItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No items to log.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setStage("input")}
              >
                Go back
              </Button>
            </div>
          ) : (
            <>
              {/* Photo preview in review */}
              {capturedImage && (
                <div className="overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/jpeg;base64,${capturedImage}`}
                    alt="Meal photo"
                    className="h-32 w-full object-cover"
                  />
                </div>
              )}

              {reviewItems.map((item, i) => (
                <Card
                  key={item.id}
                  className={cn(
                    i < 5
                      ? `animate-fade-in-delay-${i}`
                      : "animate-fade-in-delay-4",
                    removingIds.has(item.id) && "animate-slide-out"
                  )}
                >
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {item.matchedProduct?.name ?? item.ingredientName}
                        </div>
                        {item.matchedProduct?.brand && (
                          <div className="text-xs text-muted-foreground">
                            {item.matchedProduct.brand}
                          </div>
                        )}
                        {!item.matchedProduct && !item.isDirectEnergy && (
                          <div className="text-xs text-warning">
                            No match found — calories set to 0
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-muted-foreground">
                          ~{item.calories} kcal
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center justify-center rounded min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${item.ingredientName}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Editable quantity */}
                    {!item.isDirectEnergy && (
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          aria-label={`Quantity for ${item.ingredientName}`}
                          value={item.servingSize}
                          onChange={(e) =>
                            updateQuantity(item.id, Number(e.target.value) || 1)
                          }
                          className="h-8 w-20 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.servingUnit}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Summary */}
              <div className="rounded-md bg-muted/50 px-4 py-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""}{" "}
                  &middot; ~{totalCalories} kcal total
                </p>
              </div>

              {/* Mood & note */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  {MOOD_OPTIONS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={label}
                      aria-pressed={selectedMood === emoji}
                      className={cn(
                        "flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] text-lg transition-[color,background-color,box-shadow,transform] duration-[var(--duration-fast)]",
                        selectedMood === emoji
                          ? "bg-accent ring-1 ring-primary/40 scale-110"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() =>
                        setSelectedMood(selectedMood === emoji ? null : emoji)
                      }
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Add a note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    capturedImage ? setStage("choose") : setStage("input")
                  }
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={reviewItems.length === 0 || isUploading}
                  onClick={handleLogAll}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading photo...
                    </>
                  ) : (
                    "Log all"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stage: Saving */}
      {stage === "saving" && (
        <div className="flex flex-col items-center gap-3 py-8" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Saving your meal...</p>
        </div>
      )}
    </div>
  );
}
