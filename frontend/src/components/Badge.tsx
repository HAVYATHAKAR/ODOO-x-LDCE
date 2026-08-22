import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "neutral" | "ocean" | "sunset" | "success" | "warning" | "danger" | "sky";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  ocean: "bg-ocean-deep/10 text-ocean-deep",
  sunset: "bg-sunset-action/15 text-secondary",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-error-container text-on-error-container",
  sky: "bg-sky-tint text-ocean-deep",
};

interface BadgeProps {
  tone?: Tone;
  icon?: string;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon && <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span>}
      {children}
    </span>
  );
}
