import { cn } from "@/lib/utils";

export function DiaryAvatar({
  initial,
  size = 40,
  className,
}: {
  initial: string;
  size?: 32 | 40 | 44 | 56 | 80;
  className?: string;
}) {
  const fontSize = Math.round(size * 0.42);
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-diary",
        "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span style={{ fontSize, fontWeight: 800, lineHeight: 1 }}>
        {initial.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}
