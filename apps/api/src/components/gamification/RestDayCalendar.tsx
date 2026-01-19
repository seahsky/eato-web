"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X, Calendar as CalendarIcon } from "lucide-react";
import { startOfDay, format, addDays } from "date-fns";

interface RestDayCalendarProps {
  className?: string;
}

export function RestDayCalendar({ className }: RestDayCalendarProps) {
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const utils = trpc.useUtils();

  const { data: restDayData } = trpc.stats.getRestDays.useQuery();

  const declareRestDayMutation = trpc.stats.declareRestDay.useMutation({
    onSuccess: () => {
      toast.success("Rest day declared!");
      setSelectedDateStr("");
      utils.stats.getRestDays.invalidate();
      utils.stats.getStreakData.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeRestDayMutation = trpc.stats.removeRestDay.useMutation({
    onSuccess: () => {
      toast.success("Rest day removed");
      utils.stats.getRestDays.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleDeclareRestDay = () => {
    if (!selectedDateStr) return;
    if ((restDayData?.restDaysRemaining ?? 0) === 0) {
      toast.error("No rest days remaining this month");
      return;
    }
    const selectedDate = new Date(selectedDateStr);
    declareRestDayMutation.mutate({ date: selectedDate.toISOString() });
  };

  const handleRemoveRestDay = (date: Date) => {
    removeRestDayMutation.mutate({ date: date.toISOString() });
  };

  // Get tomorrow's date as the minimum selectable date
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            Rest Day Declaration
          </CardTitle>
          <Badge variant={restDayData?.restDaysRemaining === 0 ? "destructive" : "default"}>
            {restDayData?.restDaysRemaining ?? 6}/6
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="rest-day-date" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Select a future date
          </Label>
          <Input
            id="rest-day-date"
            type="date"
            value={selectedDateStr}
            onChange={(e) => setSelectedDateStr(e.target.value)}
            min={tomorrowStr}
            className="w-full"
          />
        </div>

        {/* Declare button */}
        {selectedDateStr && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleDeclareRestDay}
              disabled={declareRestDayMutation.isPending}
              className="w-full"
            >
              Declare {format(new Date(selectedDateStr), "MMM d, yyyy")} as Rest Day
            </Button>
          </motion.div>
        )}

        {/* List of declared rest days */}
        {(restDayData?.restDayDates.length ?? 0) > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">Upcoming Rest Days</p>
            <AnimatePresence>
              {restDayData?.restDayDates
                .filter((d: Date | string) => new Date(d) >= new Date())
                .sort((a: Date | string, b: Date | string) => new Date(a).getTime() - new Date(b).getTime())
                .map((restDate: Date | string) => (
                  <motion.div
                    key={new Date(restDate).toISOString()}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <span className="text-sm">{format(new Date(restDate), "EEEE, MMM d, yyyy")}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRestDay(new Date(restDate))}
                      disabled={removeRestDayMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
