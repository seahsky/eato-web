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
import { COPY } from "@/lib/copy";

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const utils = trpc.useUtils();

  const { data: entries, isLoading } = trpc.food.getByDate.useQuery(
    { date: new Date().toISOString().split("T")[0] },
    { enabled: !!id }
  );

  // Find the entry in question — try from daily entries first
  // If not found there, we'll do a broader search
  const entry = entries?.find((e: { id: string }) => e.id === id);

  const [servingSize, setServingSize] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Initialize form values when entry loads
  const currentServingSize = servingSize ?? entry?.servingSize ?? 100;

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
        },
      });
      utils.stats.getDailySummary.invalidate();
      router.back();
    } catch {
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
      // stay on page
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    <div className="mx-auto max-w-lg px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-caveat text-xl">{COPY.editHeading}</h1>
        </div>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-destructive">
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
        {/* Food info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{entry.name}</CardTitle>
            {entry.brand && (
              <p className="text-sm text-muted-foreground">{entry.brand}</p>
            )}
          </CardHeader>
        </Card>

        {/* Edit form */}
        <div>
          <Label>Serving size</Label>
          <Input
            type="number"
            min={1}
            value={currentServingSize}
            onChange={(e) => setServingSize(Number(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label>Unit</Label>
          <Input value={entry.servingUnit} readOnly className="bg-muted" />
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

        <Button className="w-full" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
