"use client";

interface MacroBarProps {
  label: string;
  value: number;
  unit?: string;
  color: string;
}

export function MacroBar({ label, value, unit = "g", color }: MacroBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs font-medium">
        {Math.round(value * 10) / 10}{unit}
      </span>
    </div>
  );
}
