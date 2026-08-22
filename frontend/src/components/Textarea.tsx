import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { inputBase } from "./Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  focusAccent?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, focusAccent, className, id, rows = 4, ...rest },
  ref,
) {
  const areaId = id || rest.name;
  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label htmlFor={areaId} className="font-label-sm text-label-sm text-on-surface">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        className={cn(
          inputBase,
          "px-3 py-3 resize-y",
          focusAccent ? "focus:ring-sunset-action focus:border-sunset-action" : "focus:ring-ocean-deep",
          error && "border-error focus:ring-error focus:border-error",
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="text-caption text-error">{error}</p>
      ) : hint ? (
        <p className="text-caption text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
});
