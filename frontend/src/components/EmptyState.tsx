import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = "travel_explore", title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/50 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-tint text-ocean-deep">
        <Icon name={icon} size={32} />
      </span>
      <h3 className="mt-4 font-headline-md text-headline-md text-ocean-deep">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
