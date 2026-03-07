"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Copy, Check, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DateNavigator } from "@/components/app/date-navigator";
import { DiaryEntryCard } from "@/components/app/diary-entry-card";
import { COPY } from "@/lib/copy";

type PartnerEntry = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  loggedAt?: string | Date;
  consumedAt?: string | Date;
};

export default function PartnerPage() {
  const { data: me, isLoading } = trpc.auth.getMe.useQuery();
  const utils = trpc.useUtils();

  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const generateCode = trpc.auth.generatePartnerCode.useMutation();
  const linkPartner = trpc.auth.linkPartner.useMutation();
  const unlinkPartner = trpc.auth.unlinkPartner.useMutation();

  // Fetch partner's daily entries
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: partnerDay } = trpc.stats.getPartnerDailySummary.useQuery(
    { date: dateStr },
    { enabled: !!me?.partner }
  );

  async function handleGenerateCode() {
    try {
      const result = await generateCode.mutateAsync();
      setGeneratedCode(result.code);
    } catch {
      // stay
    }
  }

  async function handleCopyCode() {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLinkPartner() {
    if (!code.trim()) return;
    setLinking(true);
    try {
      await linkPartner.mutateAsync({ code: code.trim() });
      utils.auth.getMe.invalidate();
      setCode("");
    } catch {
      // stay
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink() {
    try {
      await unlinkPartner.mutateAsync();
      utils.auth.getMe.invalidate();
      setUnlinkOpen(false);
    } catch {
      // stay
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasPartner = !!me?.partner;

  return (
    <div className="mx-auto max-w-lg px-4">
      <div className="py-3">
        <h1 className="font-caveat text-xl text-foreground">
          {hasPartner
            ? COPY.partnerDiaryBanner(me?.partner?.name ?? "Partner")
            : COPY.partnerHeading}
        </h1>
      </div>

      {hasPartner ? (
        <>
          {/* Partner's diary */}
          <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

          {partnerDay && (
            <div className="mt-2 space-y-1.5">
              {(partnerDay.entries as PartnerEntry[]).length > 0 ? (
                (partnerDay.entries as PartnerEntry[]).map((entry, i) => (
                  <div key={entry.id} className={i < 5 ? `animate-fade-in-delay-${i}` : "animate-fade-in-delay-4"}>
                  <DiaryEntryCard
                    entry={entry}
                    showCalories={false}
                  />
                  </div>
                ))
              ) : (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {COPY.noEntriesPartnerDay}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Manage link */}
          <div className="mt-6">
            <Dialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full text-destructive" size="sm">
                  <Unlink className="mr-2 h-4 w-4" />
                  Unlink Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{COPY.partnerUnlinkTitle(me?.partner?.name ?? "your partner")}</DialogTitle>
                  <DialogDescription>
                    {COPY.partnerUnlinkDescription}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUnlinkOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleUnlink}>
                    Unlink
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Generate code section */}
          <Card>
            <CardContent className="space-y-3 py-4">
              <h2 className="font-semibold">{COPY.partnerShareTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {COPY.partnerShareDescription}
              </p>
              {generatedCode ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md bg-muted px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest">
                    {generatedCode}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={handleGenerateCode}>
                  Generate Code
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Enter code section */}
          <Card>
            <CardContent className="space-y-3 py-4">
              <h2 className="font-semibold">{COPY.partnerEnterTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {COPY.partnerEnterDescription}
              </p>
              <div>
                <Label>Partner Code</Label>
                <Input
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
              </div>
              <Button
                className="w-full"
                disabled={code.trim().length < 6 || linking}
                onClick={handleLinkPartner}
              >
                {linking ? "Linking..." : "Link Partner"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
