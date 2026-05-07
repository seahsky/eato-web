"use client";

import { useEffect, useState, useId } from "react";

export function CalorieRing({
  consumed,
  budget,
  size = 60,
  stroke = 6,
}: {
  consumed: number;
  budget: number;
  size?: number;
  stroke?: number;
}) {
  const id = useId();
  const safeBudget = Math.max(1, budget);
  const progress = Math.min(1, consumed / safeBudget);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - progress);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={`${Math.round(consumed)} of ${Math.round(budget)} kcal`}
      aria-valuenow={Math.round(consumed)}
      aria-valuemin={0}
      aria-valuemax={Math.round(budget)}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elev-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? targetOffset : circumference}
          style={{ transition: "stroke-dashoffset 0.9s var(--ease-out-expo)" }}
          id={id}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="font-bold text-[var(--text)]"
          style={{ fontSize: Math.round(size * 0.26) }}
        >
          {Math.round(consumed)}
        </span>
        <span
          className="mt-0.5 font-medium text-[var(--text-mute)]"
          style={{ fontSize: Math.max(9, Math.round(size * 0.13)) }}
        >
          of {Math.round(budget)} kcal
        </span>
      </div>
    </div>
  );
}
