import { cn } from "@/lib/cn";
import type { TripStatus } from "@/api/types";

const MAP: Record<TripStatus, { label: string; cls: string; dot: string }> = {
  upcoming: { label: "Upcoming", cls: "bg-sky-tint text-ocean-deep", dot: "bg-ocean-deep" },
  ongoing: { label: "Ongoing", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
  completed: { label: "Completed", cls: "bg-surface-container-high text-on-surface-variant", dot: "bg-outline" },
};

export function StatusPill({ status, className }: { status: TripStatus; className?: string }) {
  const s = MAP[status] ?? MAP.upcoming;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
