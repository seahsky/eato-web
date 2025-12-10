"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Copy, Heart, UserPlus, Users, TrendingUp, Check, Unlink } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { getEnergyLabel } from "@/lib/energy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PartnerHistorySection } from "@/components/partner/partner-history-section";

function PartnerWeeklyStats({
  averageCalories,
  calorieGoal,
}: {
  averageCalories: number;
  calorieGoal: number;
}) {
  const { energyUnit } = useEnergyUnit();

  return (
    <div className="grid grid-cols-2 gap-4 text-center">
      <div className="bg-muted/50 rounded-xl p-3">
        <EnergyValue
          kcal={averageCalories}
          showUnit={false}
          toggleable
          className="text-2xl font-bold"
        />
        <p className="text-xs text-muted-foreground">Avg daily {getEnergyLabel(energyUnit)}</p>
      </div>
      <div className="bg-muted/50 rounded-xl p-3">
        <EnergyValue
          kcal={calorieGoal}
          showUnit={false}
          toggleable
          className="text-2xl font-bold"
        />
        <p className="text-xs text-muted-foreground">Daily goal</p>
      </div>
    </div>
  );
}

export default function PartnerPage() {
  const utils = trpc.useUtils();
  const { data: user, isLoading: userLoading } = trpc.auth.getMe.useQuery();
  const { data: weeklyStats, isLoading: statsLoading } = trpc.stats.getPartnerWeeklySummary.useQuery();

  const [linkCode, setLinkCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCodeMutation = trpc.auth.generatePartnerCode.useMutation({
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast.success("Link code generated!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const linkPartnerMutation = trpc.auth.linkPartner.useMutation({
    onSuccess: (data) => {
      toast.success(`Linked with ${data.partnerName}!`);
      setLinkCode("");
      utils.auth.getMe.invalidate();
      utils.stats.getPartnerWeeklySummary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unlinkPartnerMutation = trpc.auth.unlinkPartner.useMutation({
    onSuccess: () => {
      toast.success("Partner unlinked");
      utils.auth.getMe.invalidate();
      utils.stats.getPartnerWeeklySummary.invalidate();
      utils.stats.getPartnerHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkCode.length === 6) {
      linkPartnerMutation.mutate({ code: linkCode });
    }
  };

  if (userLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[200px] rounded-2xl" />
      </div>
    );
  }

  const hasPartner = !!user?.partner;

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-serif font-semibold">Partner</h1>
        <p className="text-sm text-muted-foreground">
          Track your journey together
        </p>
      </motion.div>

      {hasPartner ? (
        <>
          {/* Partner Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary-foreground">
                      {user.partner?.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary fill-primary" />
                      <h2 className="text-xl font-semibold">{user.partner?.name ?? "Partner"}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Your partner</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Unlink className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Partner?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the connection between your accounts.
                          You can always link again later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => unlinkPartnerMutation.mutate()}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Unlink
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Partner Weekly Stats */}
          {statsLoading ? (
            <Skeleton className="h-[150px] rounded-2xl" />
          ) : weeklyStats ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {weeklyStats.partnerName}&apos;s Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Days on goal</span>
                        <span className="font-medium">
                          {weeklyStats.daysOnGoal} / {weeklyStats.totalDays}
                        </span>
                      </div>
                      <Progress
                        value={(weeklyStats.daysOnGoal / weeklyStats.totalDays) * 100}
                        className="h-2"
                      />
                    </div>
                    <PartnerWeeklyStats
                      averageCalories={weeklyStats.averageCalories}
                      calorieGoal={weeklyStats.calorieGoal}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {/* Partner History */}
          <PartnerHistorySection />
        </>
      ) : (
        <>
          {/* No Partner - Link Options */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Link with Partner
                </CardTitle>
                <CardDescription>
                  Connect with your partner to track your goals together
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generate Code */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Share your code</p>
                  {generatedCode ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-lg p-4 text-center">
                        <p className="text-2xl font-mono font-bold tracking-widest">
                          {generatedCode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Valid for 24 hours
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => generateCodeMutation.mutate()}
                      disabled={generateCodeMutation.isPending}
                    >
                      {generateCodeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Generate Link Code
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Enter Code */}
                <form onSubmit={handleLinkPartner} className="space-y-3">
                  <p className="text-sm font-medium">Enter partner&apos;s code</p>
                  <div className="flex gap-2">
                    <Input
                      value={linkCode}
                      onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="text-center text-lg font-mono tracking-widest"
                    />
                    <Button
                      type="submit"
                      disabled={linkCode.length !== 6 || linkPartnerMutation.isPending}
                    >
                      {linkPartnerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Link"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
