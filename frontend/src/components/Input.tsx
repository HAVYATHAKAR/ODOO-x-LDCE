import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Leading Material Symbols icon name. */
  icon?: string;
  rightSlot?: ReactNode;
  /** Use the orange focus ring (trip settings) instead of ocean. */
  focusAccent?: boolean;
}

export const inputBase =
  "appearance-none block w-full border border-outline-variant rounded-lg shadow-sm placeholder-outline text-on-surface focus:outline-none focus:ring-2 focus:border-ocean-deep font-body-md text-body-md transition-shadow bg-surface-bright disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, rightSlot, focusAccent, className, id, ...rest },
  ref,
) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="font-label-sm text-label-sm text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline pointer-events-none">
            <Icon name={icon} size={20} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            icon ? "pl-11 pr-4 py-3" : "px-3 py-3",
            !!rightSlot && "pr-11",
            focusAccent ? "focus:ring-sunset-action focus:border-sunset-action" : "focus:ring-ocean-deep",
            error && "border-error focus:ring-error focus:border-error",
            className,
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5">{rightSlot}</span>
        )}
      </div>
      {error ? (
        <p className="text-caption text-error">{error}</p>
      ) : hint ? (
        <p className="text-caption text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
});
