import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Variant = "primary" | "outline" | "ghost" | "danger" | "white";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Material Symbols icon name shown before the label. */
  icon?: string;
  iconFill?: boolean;
  /** Show a spinner and disable. */
  loading?: boolean;
  /** Pill (rounded-full) vs. rounded-lg. Defaults to pill. */
  pill?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-sunset-action text-on-primary shadow-[0_4px_14px_rgba(255,140,0,0.3)] hover:bg-secondary-container hover:-translate-y-0.5",
  outline:
    "border-2 border-ocean-deep text-ocean-deep bg-transparent hover:bg-ocean-deep hover:text-on-primary",
  ghost: "text-on-surface-variant hover:bg-surface-container-high",
  danger: "bg-error text-on-error hover:bg-on-error-container",
  white: "bg-surface-container-lowest text-ocean-deep border border-outline-variant hover:bg-surface-container-low",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 gap-2",
  lg: "px-8 py-4 gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    icon,
    iconFill,
    loading,
    pill = true,
    fullWidth,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-label-sm text-label-sm transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none",
        pill ? "rounded-full" : "rounded-lg",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="progress_activity" className="animate-spin" size={20} />
      ) : (
        icon && <Icon name={icon} fill={iconFill} size={20} />
      )}
      {children}
    </button>
  );
});
