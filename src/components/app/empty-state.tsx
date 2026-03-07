"use client";

import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="animate-fade-in" role="status">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        {icon && <div className="text-muted-foreground [&>svg]:h-12 [&>svg]:w-12">{icon}</div>}
        <h2 className="font-caveat text-xl text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {action}
      </CardContent>
    </Card>
  );
}
