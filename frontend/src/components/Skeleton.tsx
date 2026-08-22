import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-container-high", className)} />;
}

/** A card-shaped skeleton used across list/grid loading states. */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="mt-4 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}
