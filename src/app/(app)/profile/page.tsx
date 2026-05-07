"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { format } from "date-fns";
import { ChevronRight, Loader2, LogOut, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { ACTIVITY_OPTIONS } from "@/lib/constants";
import type { Gender, ActivityLevel } from "@/server/client-types";
import { DiaryCard } from "@/components/diary/diary-card";
import { Eyebrow } from "@/components/diary/eyebrow";
import { DiaryAvatar } from "@/components/diary/avatar";
import { cn } from "@/lib/utils";

type EditField =
  | null
  | "calorieGoal"
  | "gender"
  | "age"
  | "weight"
  | "height"
  | "activityLevel";

const APP_VERSION = "v0.1.0";

function makeHandleFromEmail(email: string | null | undefined): string {
  if (!email) return "you";
  return email.split("@")[0].toLowerCase();
}

export default function ProfilePage() {
  const { signOut } = useClerk();
  const { data: me, isLoading } = trpc.auth.getMe.useQuery();
  const utils = trpc.useUtils();
  const upsertProfile = trpc.profile.upsert.useMutation();
  const unlinkPartner = trpc.auth.unlinkPartner.useMutation();

  const [editField, setEditField] = useState<EditField>(null);
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-mute)]" aria-hidden="true" />
        <span className="sr-only">Loading profile…</span>
      </div>
    );
  }

  const profile = me?.profile;
  if (!me || !profile) {
    return (
      <div className="px-5 pt-6 text-[14px] text-[var(--text-soft)]">
        Profile not set up yet.
      </div>
    );
  }

  const meExt = me as typeof me & { createdAt?: string | Date };
  const joinedDate = meExt.createdAt ? new Date(meExt.createdAt) : null;
  const handle = makeHandleFromEmail(me.email);
  const initial = (me.name?.trim() || me.email).charAt(0).toUpperCase();
  const displayName = me.name?.trim() || handle;

  const tdee = Math.round(profile.tdee ?? 0);
  const goalDaily = Math.round(profile.calorieGoal ?? 2000);

  async function patchProfile(patch: Partial<{
    gender: Gender;
    age: number;
    weight: number;
    height: number;
    activityLevel: ActivityLevel;
    calorieGoal: number;
  }>) {
    if (!profile) return;
    try {
      await upsertProfile.mutateAsync({
        gender: (patch.gender ?? profile.gender) as Gender,
        age: patch.age ?? profile.age,
        weight: patch.weight ?? profile.weight,
        height: patch.height ?? profile.height,
        activityLevel: (patch.activityLevel ?? profile.activityLevel) as ActivityLevel,
        calorieGoal: patch.calorieGoal ?? profile.calorieGoal,
      });
      utils.auth.getMe.invalidate();
      toast.success("Saved");
      setEditField(null);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-lg pb-24 animate-fade-in">
      {/* Profile header */}
      <div className="px-5 pt-6 flex flex-col items-center gap-1.5">
        <DiaryAvatar initial={initial} size={80} />
        <h1 className="mt-3 text-[28px] font-bold text-[var(--text)] tracking-[-0.01em]">
          {displayName}
        </h1>
        <p className="text-[15px] text-[var(--text-soft)]">
          @{handle}
          {joinedDate ? ` · joined ${format(joinedDate, "MMM d")}` : ""}
        </p>
      </div>

      {/* Sections */}
      <div className="px-5 mt-6 flex flex-col gap-5">
        <Section title="Diary">
          <Row
            label="Daily goal"
            value={`${goalDaily.toLocaleString()} kcal`}
            onClick={() => setEditField("calorieGoal")}
          />
          <Row
            label="First day"
            value={joinedDate ? format(joinedDate, "MMM d") : "—"}
          />
        </Section>

        <Section title="Body">
          <Row
            label="Gender"
            value={profile.gender === "MALE" ? "Male" : "Female"}
            onClick={() => setEditField("gender")}
          />
          <Row label="Age" value={String(profile.age)} onClick={() => setEditField("age")} />
          <Row
            label="Weight"
            value={`${profile.weight} kg`}
            onClick={() => setEditField("weight")}
          />
          <Row
            label="Height"
            value={`${profile.height} cm`}
            onClick={() => setEditField("height")}
          />
          <Row
            label="Activity level"
            value={
              ACTIVITY_OPTIONS.find((a) => a.value === profile.activityLevel)?.label ??
              profile.activityLevel
            }
            onClick={() => setEditField("activityLevel")}
          />
        </Section>

        <Section title="Account">
          <Row label="Email" value={me.email} />
          {me.partner && (
            <RowRaw>
              <span className="text-[14px] font-semibold text-[var(--text)]">
                Unlink partner
              </span>
              <Dialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-[var(--color-destructive)]"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Unlink className="h-3.5 w-3.5" />
                      Unlink
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Unlink from {me.partner.name ?? "your partner"}?
                    </DialogTitle>
                    <DialogDescription>
                      You won&apos;t see each other&apos;s diary anymore. You can re-link later.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUnlinkOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await unlinkPartner.mutateAsync();
                          utils.auth.getMe.invalidate();
                          setUnlinkOpen(false);
                          toast.success("Unlinked");
                        } catch {
                          toast.error("Failed to unlink. Try again.");
                        }
                      }}
                    >
                      Unlink
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </RowRaw>
          )}
        </Section>

        <Section title="App">
          <Row label="About Eato" value={APP_VERSION} />
        </Section>

        <Button
          variant="outline"
          className="w-full mt-2 text-[var(--color-destructive)]"
          onClick={() => signOut({ redirectUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Edit sheets */}
      <Sheet
        open={editField === "calorieGoal"}
        onOpenChange={(open) => !open && setEditField(null)}
      >
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <CalorieGoalEditor
            currentGoal={goalDaily}
            tdee={tdee}
            onSave={(value) => patchProfile({ calorieGoal: value })}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={editField === "gender"}
        onOpenChange={(open) => !open && setEditField(null)}
      >
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <GenderEditor
            current={profile.gender as Gender}
            onSave={(value) => patchProfile({ gender: value })}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={editField === "age"} onOpenChange={(open) => !open && setEditField(null)}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <NumberEditor
            title="Age"
            description="How old are you in years?"
            current={profile.age}
            min={13}
            max={120}
            unit=""
            onSave={(value) => patchProfile({ age: value })}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={editField === "weight"} onOpenChange={(open) => !open && setEditField(null)}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <NumberEditor
            title="Weight"
            description="Used to recompute your BMR/TDEE."
            current={profile.weight}
            min={30}
            max={300}
            step={0.1}
            unit="kg"
            onSave={(value) => patchProfile({ weight: value })}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={editField === "height"} onOpenChange={(open) => !open && setEditField(null)}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <NumberEditor
            title="Height"
            description="Used to recompute your BMR/TDEE."
            current={profile.height}
            min={100}
            max={250}
            unit="cm"
            onSave={(value) => patchProfile({ height: value })}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={editField === "activityLevel"}
        onOpenChange={(open) => !open && setEditField(null)}
      >
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <ActivityEditor
            current={profile.activityLevel as ActivityLevel}
            onSave={(value) => patchProfile({ activityLevel: value })}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Section + Row primitives ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="px-1">{title}</Eyebrow>
      <DiaryCard className="p-0 overflow-hidden">
        <div className="flex flex-col">{children}</div>
      </DiaryCard>
    </div>
  );
}

function Row({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  const Element = interactive ? "button" : "div";
  return (
    <Element
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left",
        "border-b border-[var(--divider)] last:border-b-0",
        interactive && "transition-colors active:bg-[var(--bg-elev-1)]"
      )}
    >
      <span className="text-[14px] font-semibold text-[var(--text)] flex-1">{label}</span>
      <span className="text-[12px] text-[var(--text-soft)] truncate max-w-[55%] text-right">
        {value}
      </span>
      {interactive && <ChevronRight className="h-4 w-4 text-[var(--text-mute)] shrink-0" />}
    </Element>
  );
}

function RowRaw({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3.5 border-b border-[var(--divider)] last:border-b-0">
      {children}
    </div>
  );
}

// ── Editors ──────────────────────────────────────────────────────────

function CalorieGoalEditor({
  currentGoal,
  tdee,
  onSave,
}: {
  currentGoal: number;
  tdee: number;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState<number | "">(currentGoal);
  const presets = tdee > 0
    ? [
        { label: "−500", daily: Math.max(1000, Math.round(tdee - 500)) },
        { label: "TDEE", daily: Math.round(tdee) },
        { label: "+500", daily: Math.round(tdee + 500) },
      ]
    : [];

  return (
    <>
      <SheetHeader>
        <SheetTitle>Daily goal</SheetTitle>
        <SheetDescription>
          Aim for a calorie target each day. You can change this any time.
        </SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-2 flex flex-col gap-3">
        <Input
          type="number"
          min={1000}
          max={10000}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value ? Number(e.target.value) : "")}
          className="text-center text-[24px] font-bold"
        />
        {presets.length > 0 && (
          <div className="flex gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setValue(p.daily)}
                className={cn(
                  "flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors",
                  value === p.daily
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-elev-2)] text-[var(--text)]"
                )}
              >
                {p.label}
                <span className="ml-1 text-[11px] opacity-80">
                  {p.daily.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <SheetFooter>
        <Button
          disabled={!value || Number(value) < 1000 || Number(value) > 10000}
          onClick={() => value && onSave(Number(value))}
        >
          Save
        </Button>
      </SheetFooter>
    </>
  );
}

function GenderEditor({
  current,
  onSave,
}: {
  current: Gender;
  onSave: (value: Gender) => void;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Gender</SheetTitle>
        <SheetDescription>Used to compute BMR/TDEE.</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-2 flex gap-2">
        {(["MALE", "FEMALE"] as Gender[]).map((g) => (
          <Button
            key={g}
            variant={current === g ? "default" : "outline"}
            className="flex-1"
            onClick={() => onSave(g)}
          >
            {g === "MALE" ? "Male" : "Female"}
          </Button>
        ))}
      </div>
    </>
  );
}

function NumberEditor({
  title,
  description,
  current,
  min,
  max,
  step,
  unit,
  onSave,
}: {
  title: string;
  description: string;
  current: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState<number | "">(current);
  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-2 flex items-center gap-2">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value ? Number(e.target.value) : "")}
          className="text-center text-[24px] font-bold"
        />
        {unit && <span className="text-[14px] text-[var(--text-mute)]">{unit}</span>}
      </div>
      <SheetFooter>
        <Button
          disabled={!value || Number(value) < min || Number(value) > max}
          onClick={() => value && onSave(Number(value))}
        >
          Save
        </Button>
      </SheetFooter>
    </>
  );
}

function ActivityEditor({
  current,
  onSave,
}: {
  current: ActivityLevel;
  onSave: (value: ActivityLevel) => void;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Activity level</SheetTitle>
        <SheetDescription>Adjusts your TDEE estimate.</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-2 flex flex-col gap-1.5">
        {ACTIVITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSave(opt.value)}
            className={cn(
              "rounded-2xl border px-4 py-2.5 text-left transition-colors",
              current === opt.value
                ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"
                : "border-[var(--color-border)] bg-white"
            )}
          >
            <div className="text-[14px] font-semibold text-[var(--text)]">{opt.label}</div>
            <div className="text-[12px] text-[var(--text-soft)]">{opt.description}</div>
          </button>
        ))}
      </div>
    </>
  );
}

