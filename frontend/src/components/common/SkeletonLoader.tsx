import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = "animate-pulse bg-muted rounded";

  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "w-full",
    card: "w-full h-32",
  };

  const style = {
    width: width
      ? typeof width === "number"
        ? `${width}px`
        : width
      : undefined,
    height: height
      ? typeof height === "number"
        ? `${height}px`
        : height
      : undefined,
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              index === lines - 1 && "w-3/4",
            )}
            style={index === lines - 1 ? { ...style, width: "75%" } : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("p-6 space-y-4", className)}>
    <div className="flex items-center space-x-4">
      <SkeletonLoader variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={3} />
    <div className="flex justify-between items-center">
      <SkeletonLoader variant="text" width="30%" />
      <SkeletonLoader variant="rectangular" width={80} height={32} />
    </div>
  </div>
);

export const SkeletonJobCard: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn("p-6 rounded-xl border border-slate-200 bg-white", className)}
  >
    {/* Header: Department badge and level badge */}
    <div className="flex items-start justify-between mb-5">
      <SkeletonLoader
        variant="rectangular"
        width={80}
        height={22}
        className="rounded-full"
      />
      <SkeletonLoader
        variant="rectangular"
        width={60}
        height={22}
        className="rounded-full"
      />
    </div>

    {/* Job Title - Refined size */}
    <div className="mb-5">
      <SkeletonLoader variant="text" width="85%" height={24} />
      <div className="mt-2">
        <SkeletonLoader variant="text" width="45%" height={20} />
      </div>
    </div>

    {/* Metadata - Two rows without dots */}
    <div className="space-y-2.5 mb-6">
      {/* Row 1: Location + Time */}
      <div className="flex items-center gap-4">
        <SkeletonLoader variant="text" width="30%" height={14} />
        <SkeletonLoader variant="text" width="15%" height={14} />
      </div>

      {/* Row 2: Salary + Type + Work Mode */}
      <div className="flex items-center gap-4">
        <SkeletonLoader variant="text" width="25%" height={14} />
        <SkeletonLoader variant="text" width="18%" height={14} />
        <SkeletonLoader variant="text" width="15%" height={14} />
      </div>
    </div>

    {/* Spacer */}
    <div className="flex-1 min-h-[20px]" />

    {/* Bottom stats badges */}
    <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
      <SkeletonLoader
        variant="rectangular"
        width={70}
        height={36}
        className="rounded-lg"
      />
      <SkeletonLoader
        variant="rectangular"
        width={70}
        height={36}
        className="rounded-lg"
      />
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("p-6 space-y-4", className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="40%" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
      <SkeletonLoader variant="circular" width={40} height={40} />
    </div>
  </div>
);
