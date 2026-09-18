"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

export function ProgressBar({
  value,
  max,
  className,
  trackClassName,
  fillClassName,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "h-3 w-full overflow-hidden rounded-full bg-primary-50",
          trackClassName
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary to-accent animate-xp-fill",
            fillClassName
          )}
          style={{ "--xp-target": `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
