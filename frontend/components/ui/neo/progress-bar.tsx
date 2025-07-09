import React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const progressVariants = cva("relative overflow-hidden rounded-full", {
  variants: {
    size: {
      small: "h-2",
      medium: "h-3",
      large: "h-4",
    },
    variant: {
      default: "bg-secondary-background border-2 border-border",
      blue: "bg-blue-100 border-2 border-blue-200",
      green: "bg-green-100 border-2 border-green-200",
    },
  },
  defaultVariants: {
    size: "medium",
    variant: "default",
  },
});

const progressBarVariants = cva("h-full transition-all duration-300 ease-out", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface ProgressBarProps
  extends VariantProps<typeof progressVariants>,
    VariantProps<typeof progressBarVariants> {
  className?: string;
  progress: number; // 0-100
  showPercentage?: boolean;
  label?: string;
}

export function ProgressBar({
  size,
  variant,
  className,
  progress,
  showPercentage = false,
  label,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={cn(progressVariants({ size, variant }), className)}>
        <div
          className={cn(progressBarVariants({ variant }))}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
