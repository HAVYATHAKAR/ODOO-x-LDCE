import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";

interface LogoProps {
  to?: string;
  /** White text for dark backgrounds. */
  light?: boolean;
  className?: string;
  compact?: boolean;
}

export function Logo({ to = "/", light, className, compact }: LogoProps) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          light ? "bg-white/15 text-white" : "bg-ocean-deep text-white",
        )}
      >
        <Icon name="public" fill size={22} />
      </span>
      {!compact && (
        <span
          className={cn(
            "font-display-lg text-xl font-bold tracking-tight",
            light ? "text-white" : "text-ocean-deep",
          )}
        >
          Globe<span className="text-sunset-action">Trotter</span>
        </span>
      )}
    </Link>
  );
}
