import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, description, disabled, id }: ToggleProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-deep focus:ring-offset-2 disabled:opacity-50",
        checked ? "bg-sunset-action" : "bg-surface-container-high",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer" htmlFor={id}>
      <span>
        <span className="block font-label-sm text-label-sm text-on-surface">{label}</span>
        {description && (
          <span className="block text-caption text-on-surface-variant mt-0.5">{description}</span>
        )}
      </span>
      {control}
    </label>
  );
}
