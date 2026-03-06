"use client";

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const percentage = goal > 0 ? Math.min(consumed / goal, 1.5) : 0;
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(percentage, 1) * circumference;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        <svg width="160" height="160" className="-rotate-90">
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
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(consumed)}</span>
          <span className="text-xs text-muted-foreground">
            / {goal} kcal
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        {isOver
          ? `${Math.round(consumed - goal)} kcal over`
          : `${Math.round(remaining)} kcal remaining`}
      </p>
    </div>
  );
}
