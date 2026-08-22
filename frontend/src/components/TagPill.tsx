import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TagPillProps {
  active?: boolean;
  onClick?: () => void;
  icon?: string;
  className?: string;
  children: ReactNode;
}

/** Selectable filter chip (interests, categories, region tabs). */
export function TagPill({ active, onClick, icon, className, children }: TagPillProps) {
  const interactive = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-body-sm font-semibold transition-colors whitespace-nowrap",
        active
          ? "bg-ocean-deep text-on-primary"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
        !interactive && "cursor-default",
        className,
      )}
    >
      {icon && <span className="material-symbols-outlined text-[16px] leading-none">{icon}</span>}
      {children}
    </button>
  );
}
