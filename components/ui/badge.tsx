import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeTone = "primary" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary-700",
  success: "bg-success-50 text-success",
  warning: "bg-warning-50 text-warning",
  danger: "bg-danger-50 text-danger",
  accent: "bg-accent-50 text-accent",
};

export function Badge({
  tone = "primary",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
