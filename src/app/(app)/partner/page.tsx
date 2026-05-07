"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { format, formatDistanceToNowStrict, subDays } from "date-fns";
import { Check, Copy, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { DiaryCard } from "@/components/diary/diary-card";
import { Eyebrow } from "@/components/diary/eyebrow";
import { DiaryAvatar } from "@/components/diary/avatar";
import { cn } from "@/lib/utils";

type Subtab = "feed" | "partner" | "you";

type PartnerEntry = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  loggedAt?: string | Date;
  consumedAt?: string | Date;
  note?: string | null;
  imageUrl?: string | null;
};

function makeHandleFromName(name: string | null | undefined): string {
  if (!name) return "partner";
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12) || "partner"
  );
}

function makeHandleFromEmail(email: string | null | undefined): string {
  if (!email) return "you";
  return email.split("@")[0].toLowerCase();
}

export default function PartnerPage() {
  const [subtab, setSubtab] = useState<Subtab>("feed");

  const { data: me, isLoading } = trpc.auth.getMe.useQuery();
  const utils = trpc.useUtils();
  const hasPartner = !!me?.partner;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-mute)]" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-24 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-3 flex flex-col gap-1">
        <Eyebrow>Eating together</Eyebrow>
        <h1 className="text-[28px] font-bold text-[var(--text)] leading-none tracking-[-0.01em]">
          Partner
        </h1>
      </div>

      {/* Segmented */}
      <div className="px-5 pt-3.5">
        <div className="flex gap-1.5 rounded-full bg-[var(--bg-elev-2)] p-1">
          {(["feed", "partner", "you"] as const).map((s) => {
            const active = s === subtab;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubtab(s)}
                className={cn(
                  "flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors capitalize",
                  active
                    ? "bg-white text-[var(--text)] shadow-diary"
                    : "bg-transparent text-[var(--text-mute)]"
                )}
              >
                {s === "you" ? "You" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        {subtab === "feed" && <FeedTab hasPartner={hasPartner} partnerName={me?.partner?.name ?? null} onSwitchToPartner={() => setSubtab("partner")} />}
        {subtab === "partner" && (
          <PartnerTab
            hasPartner={hasPartner}
            partnerName={me?.partner?.name ?? null}
            onUnlink={async () => {
              utils.auth.getMe.invalidate();
            }}
          />
        )}
        {subtab === "you" && (
          <YouTab
            cachedCode={(me as { partnerLinkCode?: string | null } | null)?.partnerLinkCode ?? null}
            cachedExpiry={(me as { partnerLinkCodeExpiry?: string | Date | null } | null)?.partnerLinkCodeExpiry ?? null}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Feed Tab
// ─────────────────────────────────────────────────────────────────────

function FeedTab({
  hasPartner,
  partnerName,
  onSwitchToPartner,
}: {
  hasPartner: boolean;
  partnerName: string | null;
  onSwitchToPartner: () => void;
}) {
  const today = new Date();
  const dates = useMemo(
    () => [today, subDays(today, 1), subDays(today, 2)].map((d) => format(d, "yyyy-MM-dd")),
    [today]
  );

  const day0 = trpc.stats.getPartnerDailySummary.useQuery({ date: dates[0] }, { enabled: hasPartner });
  const day1 = trpc.stats.getPartnerDailySummary.useQuery({ date: dates[1] }, { enabled: hasPartner });
  const day2 = trpc.stats.getPartnerDailySummary.useQuery({ date: dates[2] }, { enabled: hasPartner });

  if (!hasPartner) {
    return (
      <div className="px-5">
        <DiaryCard className="text-center py-8 px-6 flex flex-col items-center gap-3">
          <DiaryAvatar initial="?" size={56} />
          <p className="text-[14px] text-[var(--text-soft)]">
            Link a partner to see their moments here.
          </p>
          <Button variant="default" size="sm" onClick={onSwitchToPartner}>
            Link a partner
          </Button>
        </DiaryCard>
      </div>
    );
  }

  const allEntries: PartnerEntry[] = [
    ...((day0.data?.entries ?? []) as PartnerEntry[]),
    ...((day1.data?.entries ?? []) as PartnerEntry[]),
    ...((day2.data?.entries ?? []) as PartnerEntry[]),
  ]
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.consumedAt ?? a.loggedAt ?? 0).getTime();
      const tb = new Date(b.consumedAt ?? b.loggedAt ?? 0).getTime();
      return tb - ta;
    });

  const isLoading = day0.isLoading && day1.isLoading && day2.isLoading;
  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-mute)]" aria-hidden="true" />
        <span className="sr-only">Loading partner activity…</span>
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="px-5">
        <DiaryCard className="py-8 text-center text-[14px] text-[var(--text-soft)]">
          {partnerName ?? "Your partner"} hasn't logged anything in the last few days.
        </DiaryCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {allEntries.map((entry) => (
        <PostCard key={entry.id} entry={entry} partnerName={partnerName} />
      ))}
    </div>
  );
}

function PostCard({ entry, partnerName }: { entry: PartnerEntry; partnerName: string | null }) {
  const ts = new Date(entry.consumedAt ?? entry.loggedAt ?? Date.now());
  const handle = makeHandleFromName(partnerName);
  const initial = (partnerName ?? "P").charAt(0).toUpperCase();
  const kcal = Math.round(entry.calories);
  const time = format(ts, "HH:mm");
  const ago = formatDistanceToNowStrict(ts, { addSuffix: false });

  return (
    <DiaryCard className="p-0 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2.5">
        <DiaryAvatar initial={initial} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[var(--text)] leading-tight">
            {partnerName ?? "Partner"}
          </p>
          <p className="text-[12px] text-[var(--text-mute)] leading-tight">
            @{handle} · {ago}
          </p>
        </div>
        <span className="rounded-full bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] px-2.5 py-1 text-[11px] font-bold text-[var(--primary)]">
          {kcal} kcal
        </span>
      </div>

      {/* Photo */}
      <div className="px-4">
        <div className="relative w-full overflow-hidden rounded-[14px] bg-[var(--bg-elev-2)]" style={{ aspectRatio: "16 / 10" }}>
          {entry.imageUrl ? (
            <Image
              src={entry.imageUrl}
              alt={entry.name}
              fill
              sizes="(max-width: 512px) 100vw, 480px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <span className="text-[15px] font-semibold text-[var(--text)]">{entry.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <p className="text-[17px] font-bold text-[var(--text)] leading-tight">{entry.name}</p>
        <p className="text-[12px] text-[var(--text-mute)]">
          {entry.servingSize} {entry.servingUnit} · {time}
        </p>
        {entry.note && (
          <p className="mt-1.5 text-[15px] text-[var(--text-soft)]">{entry.note}</p>
        )}
      </div>
    </DiaryCard>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Partner Tab
// ─────────────────────────────────────────────────────────────────────

function PartnerTab({
  hasPartner,
  partnerName,
  onUnlink,
}: {
  hasPartner: boolean;
  partnerName: string | null;
  onUnlink: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const utils = trpc.useUtils();
  const linkPartner = trpc.auth.linkPartner.useMutation();
  const unlinkPartner = trpc.auth.unlinkPartner.useMutation();

  async function handleLink() {
    if (!code.trim()) return;
    setLinking(true);
    try {
      await linkPartner.mutateAsync({ code: code.trim() });
      utils.auth.getMe.invalidate();
      setCode("");
      toast.success("Partner linked");
    } catch {
      toast.error("Invalid or expired code. Please try again.");
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink() {
    try {
      await unlinkPartner.mutateAsync();
      await onUnlink();
      setUnlinkOpen(false);
      toast.success("Unlinked");
    } catch {
      toast.error("Failed to unlink. Please try again.");
    }
  }

  if (hasPartner) {
    const handle = makeHandleFromName(partnerName);
    const initial = (partnerName ?? "P").charAt(0).toUpperCase();
    return (
      <div className="flex flex-col gap-4 px-4">
        <DiaryCard className="p-3 flex items-center gap-3">
          <DiaryAvatar initial={initial} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[var(--text)] leading-tight">
              {partnerName ?? "Your partner"}
            </p>
            <p className="text-[12px] text-[var(--text-mute)]">@{handle}</p>
          </div>
        </DiaryCard>

        <Dialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full text-[var(--color-destructive)]" size="sm">
              <Unlink className="mr-2 h-4 w-4" />
              Unlink partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlink from {partnerName ?? "your partner"}?</DialogTitle>
              <DialogDescription>
                You won&apos;t see each other&apos;s diary anymore. You can re-link later with a new code.
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
    );
  }

  // Unlinked: show enter-code form
  return (
    <div className="flex flex-col gap-4 px-4">
      <DiaryCard className="p-4 flex flex-col gap-3">
        <h2 className="text-[17px] font-bold text-[var(--text)]">Got a code?</h2>
        <p className="text-[14px] text-[var(--text-soft)]">
          Enter the 6-character code your partner shared.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLink();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <Label htmlFor="partner-code">Partner code</Label>
            <Input
              id="partner-code"
              placeholder="ABC123"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
              }
              maxLength={6}
              autoComplete="off"
              pattern="[A-Z0-9]*"
              className="text-center text-lg font-mono tracking-[0.3em] uppercase"
            />
          </div>
          <Button type="submit" disabled={code.trim().length < 6 || linking}>
            {linking ? "Linking…" : "Link partner"}
          </Button>
        </form>
      </DiaryCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// You Tab
// ─────────────────────────────────────────────────────────────────────

function YouTab({
  cachedCode,
  cachedExpiry,
}: {
  cachedCode: string | null;
  cachedExpiry: string | Date | null;
}) {
  const [code, setCode] = useState<string | null>(() => {
    if (!cachedCode || !cachedExpiry) return null;
    const expiry = new Date(cachedExpiry);
    return expiry.getTime() > Date.now() ? cachedCode : null;
  });
  const [copied, setCopied] = useState(false);
  const generate = trpc.auth.generatePartnerCode.useMutation();

  async function handleGenerate() {
    try {
      const res = await generate.mutateAsync();
      setCode(res.code);
    } catch {
      toast.error("Failed to generate code. Please try again.");
    }
  }

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-4">
      <div className="rounded-[18px] bg-[var(--primary)] p-6 text-white shadow-diary">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
            Your friend code
          </span>
          {code ? (
            <>
              <p className="text-center font-mono text-[38px] font-bold tracking-[0.18em]">
                {code}
              </p>
              <p className="text-[15px] text-white/90">
                Share with your partner — codes last 24 h.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="mt-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy code"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-[15px] text-white/90">
                Generate a code your partner can use to link with you.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerate}
                disabled={generate.isPending}
                className="mt-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {generate.isPending ? "Generating…" : "Generate code"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
