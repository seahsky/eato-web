import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-mute)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
