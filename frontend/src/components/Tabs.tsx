import { cn } from "@/lib/cn";

export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  icon?: string;
  count?: number;
}

interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  className?: string;
}

export function Tabs<K extends string>({ tabs, active, onChange, className }: TabsProps<K>) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto hide-scrollbar border-b border-surface-variant", className)}>
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-body-sm font-semibold transition-colors",
              on
                ? "border-sunset-action text-ocean-deep"
                : "border-transparent text-on-surface-variant hover:text-on-surface",
            )}
          >
            {tab.icon && (
              <span className="material-symbols-outlined text-[18px] leading-none">{tab.icon}</span>
            )}
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  on ? "bg-sunset-action/15 text-secondary" : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
