"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/react";
import { Check, X, Loader2 } from "lucide-react";
import { formatEnergy } from "@/lib/energy";
import { useEnergyUnit } from "@/contexts/energy-context";

interface PendingApprovalData {
  type: "pending-approval";
  entryId: string;
  entryName: string;
  calories: number;
  mealType: string;
  loggerName: string;
}

interface PushMessage {
  type: string;
  title: string;
  body: string;
  tag?: string;
  data?: PendingApprovalData | Record<string, unknown>;
}

export function useApprovalToasts() {
  const { energyUnit } = useEnergyUnit();
  const utils = trpc.useUtils();

  const approveMutation = trpc.food.approveEntry.useMutation({
    onSuccess: () => {
      utils.food.getPendingApprovals.invalidate();
      utils.food.getPendingApprovalCount.invalidate();
      utils.stats.getDailySummary.invalidate();
    },
  });

  const rejectMutation = trpc.food.rejectEntry.useMutation({
    onSuccess: () => {
      utils.food.getPendingApprovals.invalidate();
      utils.food.getPendingApprovalCount.invalidate();
    },
  });

  const handleApprove = useCallback(
    async (entryId: string, toastId: string | number) => {
      toast.dismiss(toastId);
      toast.loading("Approving...", { id: `approve-${entryId}` });
      try {
        await approveMutation.mutateAsync({ entryId });
        toast.success("Entry approved!", { id: `approve-${entryId}` });
      } catch {
        toast.error("Failed to approve entry", { id: `approve-${entryId}` });
      }
    },
    [approveMutation]
  );

  const handleReject = useCallback(
    async (entryId: string, toastId: string | number) => {
      toast.dismiss(toastId);
      toast.loading("Rejecting...", { id: `reject-${entryId}` });
      try {
        await rejectMutation.mutateAsync({ entryId });
        toast.success("Entry rejected", { id: `reject-${entryId}` });
      } catch {
        toast.error("Failed to reject entry", { id: `reject-${entryId}` });
      }
    },
    [rejectMutation]
  );

  const showApprovalToast = useCallback(
    (data: PendingApprovalData) => {
      const toastId = `approval-${data.entryId}`;

      toast.custom(
        (t) => (
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg max-w-[360px]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-secondary-foreground">
                  {data.loggerName[0]?.toUpperCase() || "P"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">
                  {data.loggerName} logged food for you
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {data.entryName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatEnergy(data.calories, energyUnit)} &middot;{" "}
                  {data.mealType.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(data.entryId, t)}
                disabled={rejectMutation.isPending}
                className="flex-1 h-8 px-3 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Reject
              </button>
              <button
                onClick={() => handleApprove(data.entryId, t)}
                disabled={approveMutation.isPending}
                className="flex-1 h-8 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>
            </div>
          </div>
        ),
        {
          id: toastId,
          duration: 30000, // 30 seconds
          dismissible: true,
        }
      );
    },
    [energyUnit, handleApprove, handleReject, approveMutation.isPending, rejectMutation.isPending]
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) {
      return;
    }

    const handleMessage = (event: MessageEvent<PushMessage>) => {
      if (event.data?.type !== "push-notification") return;

      const data = event.data.data as PendingApprovalData | undefined;
      if (data?.type !== "pending-approval") return;

      showApprovalToast(data);
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [showApprovalToast]);
}
