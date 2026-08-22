import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, children, ...rest },
  ref,
) {
  const selectId = id || rest.name;
  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="font-label-sm text-label-sm text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "appearance-none block w-full pl-3 pr-10 py-3 border border-outline-variant rounded-lg shadow-sm text-on-surface bg-surface-bright font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-ocean-deep focus:border-ocean-deep transition-shadow disabled:opacity-60",
            error && "border-error focus:ring-error focus:border-error",
            className,
          )}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-outline">
          <Icon name="expand_more" size={20} />
        </span>
      </div>
      {error ? (
        <p className="text-caption text-error">{error}</p>
      ) : hint ? (
        <p className="text-caption text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
});
