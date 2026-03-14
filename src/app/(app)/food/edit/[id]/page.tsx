"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { COPY } from "@/lib/copy";
import { MOOD_OPTIONS } from "@/lib/constants";

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const utils = trpc.useUtils();

  const { data: entry, isLoading } = trpc.food.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const [servingSize, setServingSize] = useState<number | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Initialize form values when entry loads
  const currentServingSize = servingSize ?? entry?.servingSize ?? 100;
  const currentMood = mood !== null ? mood : (entry?.mood ?? null);
  const currentNote = note !== null ? note : (entry?.note ?? "");

  const updateEntry = trpc.food.update.useMutation();
  const deleteEntry = trpc.food.delete.useMutation();

  async function handleSave() {
    if (!entry) return;
    setSaving(true);
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        data: {
          servingSize: currentServingSize,
          mood: currentMood ?? undefined,
          note: currentNote || undefined,
        },
      });
      utils.stats.getDailySummary.invalidate();
      router.back();
    } catch {
      toast.error("Failed to save changes. Please try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteEntry.mutateAsync({ id: entry.id });
      utils.stats.getDailySummary.invalidate();
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to delete entry. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading entry...</span>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-muted-foreground">{COPY.editNotFound}</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/dashboard">Back to diary</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} aria-label="Go back" className="flex items-center justify-center min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-caveat text-xl">{COPY.editHeading}</h1>
        </div>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{COPY.deleteTitle}</DialogTitle>
              <DialogDescription>
                {COPY.deleteDescription}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" className="text-destructive" onClick={handleDelete}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {/* Photo */}
        {entry.imageUrl && (
          <div className="overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.imageUrl}
              alt={`Photo of ${entry.name}`}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Food info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="truncate text-base">{entry.name}</CardTitle>
            {entry.brand && (
              <p className="text-sm text-muted-foreground">{entry.brand}</p>
            )}
          </CardHeader>
        </Card>

        {/* Edit form */}
        <div>
          <Label htmlFor="serving-size">Serving size</Label>
          <Input
            id="serving-size"
            type="number"
            min={1}
            value={currentServingSize}
            onChange={(e) => setServingSize(Number(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label htmlFor="serving-unit">Unit</Label>
          <Input id="serving-unit" value={entry.servingUnit} readOnly className="bg-muted" />
        </div>

        {/* Nutrition info */}
        <Card>
          <CardContent className="space-y-1 py-3 text-sm">
            <div className="flex justify-between">
              <span>Calories</span>
              <strong>{Math.round(entry.calories)} kcal</strong>
            </div>
            {entry.protein != null && (
              <div className="flex justify-between">
                <span>Protein</span>
                <span>{entry.protein}g</span>
              </div>
            )}
            {entry.carbs != null && (
              <div className="flex justify-between">
                <span>Carbs</span>
                <span>{entry.carbs}g</span>
              </div>
            )}
            {entry.fat != null && (
              <div className="flex justify-between">
                <span>Fat</span>
                <span>{entry.fat}g</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood & note */}
        <div className="space-y-2">
          <Label>Mood</Label>
          <div className="flex items-center gap-1.5">
            {MOOD_OPTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                aria-label={label}
                aria-pressed={currentMood === emoji}
                className={cn(
                  "flex items-center justify-center rounded-full min-h-[44px] min-w-[44px] text-lg transition-[color,background-color,box-shadow,transform] duration-[var(--duration-fast)]",
                  currentMood === emoji
                    ? "bg-accent ring-1 ring-primary/40 scale-110"
                    : "hover:bg-accent/50"
                )}
                onClick={() =>
                  setMood(currentMood === emoji ? "" : emoji)
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="entry-note">Note</Label>
          <Input
            id="entry-note"
            placeholder="Add a note (optional)"
            value={currentNote}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </div>

        <Button className="w-full" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
