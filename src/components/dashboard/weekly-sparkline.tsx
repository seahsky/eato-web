"use client";

import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DayData {
  date: Date;
  totalCalories: number;
  calorieGoal: number;
  goalMet: boolean;
}

interface WeeklySparklineProps {
  days: DayData[];
  calorieGoal: number;
  hasPartner?: boolean;
  onDayClick?: (date: Date) => void;
  className?: string;
}

export function WeeklySparkline({
  days,
  calorieGoal,
  hasPartner = false,
  onDayClick,
  className,
}: WeeklySparklineProps) {
  if (!days || days.length === 0) return null;

  // Calculate scale based on max calories (at least the goal)
  const maxCalories = Math.max(
    calorieGoal * 1.2,
    ...days.map((d) => d.totalCalories)
  );

  // SVG dimensions
  const width = 280;
  const height = 60;
  const padding = { top: 8, bottom: 20, left: 8, right: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points for the sparkline
  const points = days.map((day, index) => {
    const x = padding.left + (index / (days.length - 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      (day.totalCalories / maxCalories) * chartHeight;
    return { x, y, ...day };
  });

  // Create path data for smooth curve
  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }
    // Use quadratic bezier for smooth curves
    const prev = points[index - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${acc} Q ${cpX},${prev.y} ${point.x},${point.y}`;
  }, "");

  // Goal line Y position
  const goalY =
    padding.top + chartHeight - (calorieGoal / maxCalories) * chartHeight;

  // Gradient colors based on partner status
  const primaryColor = "var(--primary)";
  const secondaryColor = hasPartner ? "var(--secondary)" : "var(--primary)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("w-full", className)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-16"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for the line */}
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={hasPartner ? secondaryColor : primaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.8" />
          </linearGradient>

          {/* Gradient for area fill */}
          <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Goal reference line */}
        <line
          x1={padding.left}
          y1={goalY}
          x2={width - padding.right}
          y2={goalY}
          stroke="var(--muted-foreground)"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.4"
        />

        {/* Goal label */}
        <text
          x={width - padding.right - 4}
          y={goalY - 3}
          className="fill-muted-foreground text-[8px]"
          textAnchor="end"
        >
          Goal
        </text>

        {/* Area under curve */}
        <motion.path
          d={`${pathData} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`}
          fill="url(#area-gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />

        {/* Main sparkline */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="url(#sparkline-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <motion.g
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            style={{ cursor: onDayClick ? "pointer" : "default" }}
            onClick={() => onDayClick?.(point.date)}
          >
            {/* Outer ring for goal met */}
            {point.goalMet && point.totalCalories > 0 && (
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="none"
                stroke="var(--success)"
                strokeWidth="1.5"
                opacity="0.5"
              />
            )}
            {/* Inner dot */}
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={
                point.totalCalories === 0
                  ? "var(--muted)"
                  : point.goalMet
                    ? "var(--success)"
                    : point.totalCalories > calorieGoal
                      ? "var(--destructive)"
                      : "var(--primary)"
              }
              stroke="var(--background)"
              strokeWidth="1.5"
            />
          </motion.g>
        ))}

        {/* Day labels */}
        {points.map((point, index) => (
          <text
            key={`label-${index}`}
            x={point.x}
            y={height - 4}
            className="fill-muted-foreground text-[9px] font-medium"
            textAnchor="middle"
          >
            {format(point.date, "EEE").charAt(0)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--success)" }}
          />
          <span>On goal</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--destructive)" }}
          />
          <span>Over</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--muted)" }}
          />
          <span>No data</span>
        </div>
      </div>
    </motion.div>
  );
}
