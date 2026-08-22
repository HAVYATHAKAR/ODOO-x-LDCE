import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import type { CityOut, CitySummary } from "@/api/types";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const FALLBACK_CITY =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=60";

interface CityCardProps {
  city: CityOut | CitySummary;
  saved?: boolean;
  onToggleSave?: () => void;
  savingBusy?: boolean;
  footer?: ReactNode;
  /** Link target; defaults to the city detail page. */
  to?: string;
}

export function CityCard({ city, saved, onToggleSave, savingBusy, footer, to }: CityCardProps) {
  const popularity = "popularity_score" in city ? city.popularity_score : undefined;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,51,102,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,51,102,0.1)]">
      <Link to={to ?? `/cities/${city.id}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <img
            src={city.image_url || FALLBACK_CITY}
            alt={city.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 card-gradient" />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="truncate font-headline-md text-lg font-bold text-white">{city.name}</h3>
            <p className="flex items-center gap-1 text-body-sm text-white/85">
              <Icon name="location_on" size={16} />
              {city.country}
            </p>
          </div>
        </div>
      </Link>

      {onToggleSave && (
        <button
          type="button"
          onClick={onToggleSave}
          disabled={savingBusy}
          aria-label={saved ? "Remove from saved" : "Save destination"}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-colors disabled:opacity-60",
            saved ? "text-sunset-action" : "text-on-surface-variant hover:text-ocean-deep",
          )}
        >
          <Icon name="favorite" fill={saved} size={20} />
        </button>
      )}

      {(popularity !== undefined || footer) && (
        <div className="flex items-center justify-between gap-2 p-3">
          {popularity !== undefined ? (
            <span className="flex items-center gap-1 text-caption font-semibold text-on-surface-variant">
              <Icon name="trending_up" size={16} className="text-sunset-action" />
              Popularity {popularity}
            </span>
          ) : (
            <span />
          )}
          {footer}
        </div>
      )}
    </div>
  );
}
