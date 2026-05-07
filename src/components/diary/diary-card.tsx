import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function DiaryCard({
  className,
  children,
  padded = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[var(--color-border)] bg-white shadow-diary",
        padded && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
