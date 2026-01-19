"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Smartphone, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/use-push-notifications";
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

export function NotificationSettings() {
  const utils = trpc.useUtils();
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: hookLoading,
    iosRequiresPWA,
    iosVersionTooOld,
  } = usePushNotifications();

  const { data: settings, isLoading: settingsLoading } =
    trpc.notification.getSettings.useQuery();
  const { data: subscriptions, isLoading: subscriptionsLoading } =
    trpc.notification.getSubscriptions.useQuery();

  const updateSettingsMutation = trpc.notification.updateSettings.useMutation({
    onSuccess: () => {
      utils.notification.getSettings.invalidate();
      toast.success("Settings updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeDeviceMutation = trpc.notification.unsubscribeDevice.useMutation({
    onSuccess: () => {
      utils.notification.getSubscriptions.invalidate();
      toast.success("Device removed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [enablingNotifications, setEnablingNotifications] = useState(false);

  type SettingsKey =
    | "partnerFoodLogged"
    | "partnerGoalReached"
    | "partnerLinked"
    | "receiveNudges";

  const handleToggle = (key: SettingsKey, value: boolean) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true);
    const success = await subscribe();
    setEnablingNotifications(false);
    if (success) {
      toast.success("Notifications enabled");
    } else if (permission === "denied") {
      toast.error("Please enable notifications in your browser settings");
    }
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
    toast.success("Notifications disabled");
  };

  // Format user agent for display
  const formatDeviceName = (userAgent: string | null): string => {
    if (!userAgent) return "Unknown device";

    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      return "iOS Device";
    }
    if (userAgent.includes("Android")) {
      return "Android Device";
    }
    if (userAgent.includes("Mac")) {
      return "Mac";
    }
    if (userAgent.includes("Windows")) {
      return "Windows PC";
    }
    if (userAgent.includes("Linux")) {
      return "Linux";
    }
    return "Browser";
  };

  if (!isSupported) {
    let message = "Push notifications are not supported in this browser";

    if (iosRequiresPWA) {
      message = "To enable notifications, add Eato to your home screen first. Tap the share button and select 'Add to Home Screen'.";
    } else if (iosVersionTooOld) {
      message = "Push notifications require iOS 16.4 or later. Please update your device.";
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellOff className="w-4 h-4" />
            Notifications
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isLoading = settingsLoading || hookLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-4 h-4" />
          Notifications
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Push Notifications */}
        {permission === "denied" ? (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        ) : !isSubscribed ? (
          <Button
            onClick={handleEnableNotifications}
            disabled={enablingNotifications}
            className="w-full"
          >
            {enablingNotifications ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            Enable push notifications
          </Button>
        ) : (
          <>
            {/* Notification Type Settings */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : settings ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="partnerFoodLogged" className="text-sm">
                      Partner food logged
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When your partner logs a meal
                    </p>
                  </div>
                  <Switch
                    id="partnerFoodLogged"
                    checked={settings.partnerFoodLogged}
                    onCheckedChange={(checked) =>
                      handleToggle("partnerFoodLogged", checked)
                    }
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="partnerGoalReached" className="text-sm">
                      Partner goal reached
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When your partner hits their daily goal
                    </p>
                  </div>
                  <Switch
                    id="partnerGoalReached"
                    checked={settings.partnerGoalReached}
                    onCheckedChange={(checked) =>
                      handleToggle("partnerGoalReached", checked)
                    }
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="receiveNudges" className="text-sm">
                      Receive nudges
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow your partner to send you reminders
                    </p>
                  </div>
                  <Switch
                    id="receiveNudges"
                    checked={settings.receiveNudges}
                    onCheckedChange={(checked) =>
                      handleToggle("receiveNudges", checked)
                    }
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>
              </div>
            ) : null}

            {/* Registered Devices */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Registered devices</h4>
              {subscriptionsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{formatDeviceName(sub.userAgent)}</p>
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(sub.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove device?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This device will no longer receive push notifications.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                removeDeviceMutation.mutate({
                                  subscriptionId: sub.id,
                                })
                              }
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No devices registered</p>
              )}
            </div>

            {/* Disable All Notifications */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDisableNotifications}
                className="w-full text-muted-foreground"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Disable all notifications
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
