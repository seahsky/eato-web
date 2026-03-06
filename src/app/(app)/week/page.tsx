"use client";

import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WeekPage() {
  return (
    <div className="mx-auto max-w-lg px-4">
      <div className="py-3">
        <h1 className="text-lg font-bold">Weekly Overview</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Weekly overview coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
