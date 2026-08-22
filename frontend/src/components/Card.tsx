import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the hover-lift + stronger shadow interaction from the mockups. */
  hover?: boolean;
  /** Corner radius token. Mockups mix 16px and 24px; default 24px. */
  radius?: "xl" | "2xl" | "24";
  children: ReactNode;
}

const RADII = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "24": "rounded-[24px]",
} as const;

export function Card({ hover, radius = "24", className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest border border-surface-variant shadow-[0_4px_20px_rgba(0,51,102,0.08)]",
        RADII[radius],
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,51,102,0.1)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
