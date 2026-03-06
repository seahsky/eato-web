"use client";

import { useState } from "react";
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

export default function PartnerPage() {
  const { data: me, isLoading } = trpc.auth.getMe.useQuery();
  const utils = trpc.useUtils();

  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  const generateCode = trpc.auth.generatePartnerCode.useMutation();
  const linkPartner = trpc.auth.linkPartner.useMutation();
  const unlinkPartner = trpc.auth.unlinkPartner.useMutation();

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
        <h1 className="text-lg font-bold">Partner</h1>
      </div>

      {hasPartner ? (
        <>
          <Card className="mb-4">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Linked with</p>
              <p className="mt-1 text-xl font-bold">{me?.partner?.name ?? "Partner"}</p>
            </CardContent>
          </Card>

          <Dialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive">
                <Unlink className="mr-2 h-4 w-4" />
                Unlink Partner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unlink Partner</DialogTitle>
                <DialogDescription>
                  Are you sure you want to unlink from {me?.partner?.name ?? "your partner"}?
                  You will no longer be able to see each other&apos;s progress.
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
        </>
      ) : (
        <div className="space-y-6">
          {/* Generate code section */}
          <Card>
            <CardContent className="space-y-3 py-4">
              <h2 className="font-semibold">Share Your Code</h2>
              <p className="text-sm text-muted-foreground">
                Generate a code and share it with your partner so they can link with you.
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
              <h2 className="font-semibold">Enter Partner&apos;s Code</h2>
              <p className="text-sm text-muted-foreground">
                Enter the 6-character code your partner shared with you.
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
