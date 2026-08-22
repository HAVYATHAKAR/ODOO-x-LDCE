import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  /** Tailwind bg class for the filled portion. */
  barClass?: string;
  className?: string;
  /** Turn the bar red once value exceeds max. */
  warnOnOver?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  barClass = "bg-sunset-action",
  className,
  warnOnOver,
}: ProgressBarProps) {
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const over = warnOnOver && ratio > 1;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-container-high", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", over ? "bg-error" : barClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
