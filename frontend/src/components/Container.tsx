import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Consistent page gutter + max width for app and public screens. */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  const max =
    size === "narrow" ? "max-w-3xl" : size === "wide" ? "max-w-[1440px]" : "max-w-container-max";
  return (
    <div className={cn("mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8", max, className)}>{children}</div>
  );
}
