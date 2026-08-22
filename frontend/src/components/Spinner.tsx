import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className }: SpinnerProps) {
  return (
    <Icon
      name="progress_activity"
      size={size}
      className={cn("animate-spin text-ocean-deep", className)}
    />
  );
}

/** Full-area centered spinner for route/section loading states. */
export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-on-surface-variant">
      <Spinner size={40} />
      {label && <p className="font-body-md text-body-md">{label}</p>}
    </div>
  );
}
