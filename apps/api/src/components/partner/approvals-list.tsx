"use client";

import { trpc } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnergyValue } from "@/components/ui/energy-value";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function ApprovalsList() {
  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.food.getPendingApprovals.useQuery();

  const approveMutation = trpc.food.approveEntry.useMutation({
    onMutate: async ({ entryId }) => {
      // Cancel any outgoing refetches
      await utils.food.getPendingApprovals.cancel();

      // Snapshot the previous value
      const previousEntries = utils.food.getPendingApprovals.getData();

      // Optimistically remove from the list
      utils.food.getPendingApprovals.setData(undefined, (old) =>
        old?.filter((e) => e.id !== entryId)
      );

      return { previousEntries };
    },
    onSuccess: () => {
      toast.success("Entry approved!");
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousEntries) {
        utils.food.getPendingApprovals.setData(undefined, context.previousEntries);
      }
      toast.error(error.message || "Failed to approve entry");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      utils.food.getPendingApprovals.invalidate();
      utils.food.getPendingApprovalCount.invalidate();
      utils.stats.getDailySummary.invalidate();
    },
  });

  const rejectMutation = trpc.food.rejectEntry.useMutation({
    onMutate: async ({ entryId }) => {
      await utils.food.getPendingApprovals.cancel();

      const previousEntries = utils.food.getPendingApprovals.getData();

      // Optimistically remove from the list
      utils.food.getPendingApprovals.setData(undefined, (old) =>
        old?.filter((e) => e.id !== entryId)
      );

      return { previousEntries };
    },
    onSuccess: () => {
      toast.success("Entry rejected");
    },
    onError: (error, _variables, context) => {
      if (context?.previousEntries) {
        utils.food.getPendingApprovals.setData(undefined, context.previousEntries);
      }
      toast.error(error.message || "Failed to reject entry");
    },
    onSettled: () => {
      utils.food.getPendingApprovals.invalidate();
      utils.food.getPendingApprovalCount.invalidate();
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
        <p className="text-sm">No pending approvals</p>
        <p className="text-xs mt-1">
          Entries logged by your partner will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
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
                      by {entry.loggedByName} &middot;{" "}
                      {format(new Date(entry.loggedAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 ml-2">
                {entry.mealType.toLowerCase()}
              </Badge>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <EnergyValue kcal={entry.calories} className="font-semibold" toggleable />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => rejectMutation.mutate({ entryId: entry.id })}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {rejectMutation.isPending && rejectMutation.variables?.entryId === entry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => approveMutation.mutate({ entryId: entry.id })}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {approveMutation.isPending && approveMutation.variables?.entryId === entry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
