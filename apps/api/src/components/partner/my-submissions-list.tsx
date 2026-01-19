"use client";

import { trpc } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnergyValue } from "@/components/ui/energy-value";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmissionEntry {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: Date;
  mealType: string;
  approvalStatus: string;
  rejectionNote: string | null;
  user: { name: string | null };
}

export function MySubmissionsList() {
  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.food.getMyPendingSubmissions.useQuery();

  const resubmitMutation = trpc.food.resubmitEntry.useMutation({
    onSuccess: () => {
      toast.success("Entry resubmitted for approval");
      utils.food.getMyPendingSubmissions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resubmit entry");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No pending submissions</p>
        <p className="text-xs mt-1">
          Entries you log for your partner will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry: SubmissionEntry) => (
        <Card key={entry.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt={entry.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      for {entry.user.name} &middot;{" "}
                      {format(new Date(entry.loggedAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
              <Badge
                variant={entry.approvalStatus === "REJECTED" ? "destructive" : "secondary"}
                className="shrink-0 ml-2"
              >
                {entry.approvalStatus.toLowerCase()}
              </Badge>
            </div>

            {entry.rejectionNote && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg mt-2">
                &ldquo;{entry.rejectionNote}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <EnergyValue kcal={entry.calories} className="font-semibold" toggleable />

              {entry.approvalStatus === "REJECTED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => resubmitMutation.mutate({ entryId: entry.id })}
                  disabled={resubmitMutation.isPending}
                >
                  {resubmitMutation.isPending && resubmitMutation.variables?.entryId === entry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Resubmit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
