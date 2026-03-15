"use client";

import { useState, useEffect, useId } from "react";

interface CalorieRingProps {
  consumed: number;
  budget: number;
  weekLabel?: string;
}

export function CalorieRing({ consumed, budget, weekLabel }: CalorieRingProps) {
  const gradientId = useId();
  const percentage = budget > 0 ? Math.min(consumed / budget, 1) : 0;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - percentage * circumference;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        <svg
          width="160"
          height="160"
          className="-rotate-90"
          role="progressbar"
          aria-label={`${Math.round(consumed).toLocaleString()} of ${Math.round(budget).toLocaleString()} calories consumed`}
          aria-valuenow={Math.round(consumed)}
          aria-valuemin={0}
          aria-valuemax={Math.round(budget)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'var(--color-accent)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--color-primary)' }} />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? targetOffset : circumference}
            style={{ transition: "stroke-dashoffset 1.2s var(--ease-out-expo)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {weekLabel && (
            <span className="font-caveat text-sm text-muted-foreground">
              {weekLabel}
            </span>
          )}
          <span className="text-lg font-bold">
            {Math.round(consumed).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            of {Math.round(budget).toLocaleString()} kcal
          </span>
        </div>
      </div>
    </div>
  );
}
