import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, { cls: string; icon: string }> = {
  info: { cls: "bg-sky-tint text-ocean-deep border-ocean-deep/20", icon: "info" },
  success: { cls: "bg-green-50 text-green-800 border-green-200", icon: "check_circle" },
  warning: { cls: "bg-amber-50 text-amber-800 border-amber-200", icon: "warning" },
  danger: { cls: "bg-error-container text-on-error-container border-error/20", icon: "error" },
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function Alert({ tone = "info", title, className, children }: AlertProps) {
  const t = TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3", t.cls, className)} role="alert">
      <Icon name={t.icon} size={20} className="mt-0.5 shrink-0" />
      <div className="text-body-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
