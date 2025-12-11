"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, Loader2, Clock } from "lucide-react";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";

const PRESET_MESSAGES = [
  "Don't forget to log your meals!",
  "How's your day going? Remember to track!",
  "Let's stay on track together!",
  "Time to log that meal!",
];

interface NudgePartnerButtonProps {
  partnerName: string;
}

export function NudgePartnerButton({ partnerName }: NudgePartnerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const { data: lastNudge, refetch } = trpc.notification.getLastNudge.useQuery();
  const { data: hasSubscription } = trpc.notification.hasSubscription.useQuery();

  const sendNudgeMutation = trpc.notification.sendNudge.useMutation({
    onSuccess: (data) => {
      setIsOpen(false);
      setCustomMessage("");
      setSelectedPreset(null);
      refetch();

      if (data.delivered) {
        toast.success(`Nudge sent to ${data.partnerName}`);
      } else {
        toast.info(`${data.partnerName} doesn't have notifications enabled`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update cooldown timer
  useEffect(() => {
    if (!lastNudge?.cooldownRemainingMs) {
      setCooldownRemaining(0);
      return;
    }

    setCooldownRemaining(lastNudge.cooldownRemainingMs);

    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        const newValue = prev - 1000;
        if (newValue <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastNudge?.cooldownRemainingMs]);

  const handleSend = () => {
    const message = customMessage.trim() || selectedPreset || undefined;
    sendNudgeMutation.mutate({ message });
  };

  const formatCooldown = (ms: number): string => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const canSendNudge = cooldownRemaining <= 0;

  // Don't show if user doesn't have notifications set up
  if (hasSubscription === false) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!canSendNudge}
          className="gap-2"
        >
          {canSendNudge ? (
            <>
              <Bell className="w-4 h-4" />
              Nudge
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              {formatCooldown(cooldownRemaining)}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a nudge to {partnerName}</DialogTitle>
          <DialogDescription>
            Send a friendly reminder to your partner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Preset messages */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick messages</p>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_MESSAGES.map((message) => (
                <button
                  key={message}
                  onClick={() => {
                    setSelectedPreset(message);
                    setCustomMessage("");
                  }}
                  className={`text-left text-sm p-3 rounded-lg border transition-colors ${
                    selectedPreset === message
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {message}
                </button>
              ))}
            </div>
          </div>

          {/* Custom message */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Or write your own</p>
            <Input
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="Type a custom message..."
              maxLength={200}
            />
            {customMessage && (
              <p className="text-xs text-muted-foreground text-right">
                {customMessage.length}/200
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendNudgeMutation.isPending}
          >
            {sendNudgeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            Send nudge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
