"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";

export function PartnerShieldCard() {
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const utils = trpc.useUtils();

  const { data: shieldStatus } = trpc.stats.getPartnerShieldStatus.useQuery();
  const { data: shieldHistory } = trpc.stats.getShieldHistory.useQuery();

  const useShieldMutation = trpc.stats.usePartnerShield.useMutation({
    onSuccess: (data) => {
      toast.success(`Shield used! ${data.partnerName}'s streak saved!`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      utils.stats.getPartnerShieldStatus.invalidate();
      utils.stats.getShieldHistory.invalidate();
      utils.stats.getPartnerStreakData.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!shieldStatus) return null;

  const canUseShield = shieldStatus.userCanShield.canUseShield && shieldStatus.userShields > 0;
  const eligibilityReason = shieldStatus.userCanShield.reason;

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Partner Shields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shield Inventory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground mb-2">Your Shields</span>
              <div className="flex gap-1">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Shield
                    key={i}
                    className={`w-6 h-6 ${i < shieldStatus.userShields ? "text-primary fill-primary" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold mt-1">{shieldStatus.userShields}/2</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground mb-2">Partner's Shields</span>
              <div className="flex gap-1">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Shield
                    key={i}
                    className={`w-6 h-6 ${i < shieldStatus.partnerShields ? "text-secondary fill-secondary" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold mt-1">{shieldStatus.partnerShields}/2</span>
            </div>
          </div>

          {/* Shield Opportunity Alert */}
          <AnimatePresence>
            {canUseShield && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">Save your partner's streak!</p>
                    <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                      {shieldStatus.partnerName} missed yesterday
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (shieldStatus.userCanShield.targetDate) {
                          useShieldMutation.mutate({ targetDate: shieldStatus.userCanShield.targetDate.toISOString() });
                        }
                      }}
                      disabled={useShieldMutation.isPending}
                      className="mt-3"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Use Shield
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ineligibility Message */}
          {!canUseShield && shieldStatus.userShields > 0 && eligibilityReason && (
            <p className="text-sm text-muted-foreground text-center">
              {eligibilityReason}
            </p>
          )}

          {/* No shields message */}
          {shieldStatus.userShields === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              No shields remaining this month. They reset on the 1st!
            </p>
          )}

          {/* Shield History */}
          {shieldHistory && (shieldHistory.shieldsGiven.length > 0 || shieldHistory.shieldsReceived.length > 0) && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Recent Shield History</p>
              <div className="space-y-1">
                {[
                  ...shieldHistory.shieldsGiven.map((s: NonNullable<typeof shieldHistory>['shieldsGiven'][number]) => ({ ...s, type: "given" as const })),
                  ...shieldHistory.shieldsReceived.map((s: NonNullable<typeof shieldHistory>['shieldsReceived'][number]) => ({ ...s, type: "received" as const })),
                ]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((shield, idx) => (
                    <div
                      key={`${shield.type}-${shield.date.toISOString()}-${idx}`}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>
                          {shield.type === "given" ? "You saved" : "Saved by"}{" "}
                          <span className="font-medium">{shield.partnerName}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(shield.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
