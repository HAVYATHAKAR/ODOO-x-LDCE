import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { citiesApi, activitiesApi } from "@/api/endpoints/catalog";
import { qk } from "@/lib/queryClient";
import { useDebounce } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { formatMoney } from "@/lib/format";
import type { ActivityOut, CitySummary } from "@/api/types";

// ── City picker ──────────────────────────────────────────────
interface CityPickerProps {
  value: CitySummary | null;
  onChange: (city: CitySummary | null) => void;
  label?: string;
}

export function CityPicker({ value, onChange, label = "City" }: CityPickerProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 300);

  const { data, isFetching } = useQuery({
    queryKey: qk.cities({ q: debounced, picker: true }),
    queryFn: () => citiesApi.search({ q: debounced || undefined, size: 8 }),
    enabled: open,
  });

  if (value) {
    return (
      <div className="flex flex-col space-y-1.5">
        <span className="font-label-sm text-label-sm text-on-surface">{label}</span>
        <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-bright px-3 py-2.5">
          <span className="flex items-center gap-2 text-body-md text-on-surface">
            <Icon name="location_on" size={20} className="text-ocean-deep" />
            {value.name}, {value.country}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-outline hover:text-error"
            aria-label="Clear city"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col space-y-1.5">
      <span className="font-label-sm text-label-sm text-on-surface">{label}</span>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
          <Icon name="search" size={20} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search a city…"
          className="block w-full rounded-lg border border-outline-variant bg-surface-bright py-3 pl-11 pr-4 text-body-md focus:outline-none focus:ring-2 focus:ring-ocean-deep"
        />
      </div>
      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_8px_30px_rgba(0,51,102,0.15)]">
          {isFetching ? (
            <div className="flex justify-center py-4">
              <Spinner size={20} />
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => onChange({ id: c.id, name: c.name, country: c.country, image_url: c.image_url })}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-md hover:bg-surface-container-low"
              >
                <Icon name="location_on" size={18} className="text-ocean-deep" />
                {c.name}, {c.country}
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-body-sm text-on-surface-variant">No cities found</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Activity picker (catalog) ────────────────────────────────
interface ActivityPickerProps {
  cityId: number | null;
  value: ActivityOut | null;
  onChange: (activity: ActivityOut | null) => void;
  currency?: string;
}

export function ActivityPicker({ cityId, value, onChange, currency = "INR" }: ActivityPickerProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 300);

  const { data, isFetching } = useQuery({
    queryKey: qk.activities({ q: debounced, cityId }),
    queryFn: () =>
      activitiesApi.search({
        q: debounced || undefined,
        city_id: cityId ?? undefined,
        size: 8,
      }),
    enabled: open,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-bright px-3 py-2.5">
        <span className="flex items-center gap-2 text-body-md text-on-surface">
          <Icon name="local_activity" size={20} className="text-sunset-action" />
          {value.name}
          <span className="text-caption text-on-surface-variant">
            · {formatMoney(value.estimated_cost, currency)}
          </span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-outline hover:text-error" aria-label="Clear">
          <Icon name="close" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
          <Icon name="search" size={20} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search activities…"
          className="block w-full rounded-lg border border-outline-variant bg-surface-bright py-3 pl-11 pr-4 text-body-md focus:outline-none focus:ring-2 focus:ring-ocean-deep"
        />
      </div>
      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_8px_30px_rgba(0,51,102,0.15)]">
          {isFetching ? (
            <div className="flex justify-center py-4">
              <Spinner size={20} />
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((a) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={() => onChange(a)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-surface-container-low",
                )}
              >
                <span className="flex items-center gap-2 text-body-md">
                  <Icon name="local_activity" size={18} className="text-sunset-action" />
                  {a.name}
                </span>
                <span className="text-caption text-on-surface-variant">
                  {formatMoney(a.estimated_cost, currency)}
                </span>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-body-sm text-on-surface-variant">No activities found</p>
          )}
        </div>
      )}
    </div>
  );
}
