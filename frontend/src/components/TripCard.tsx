import { Link } from "react-router-dom";

import type { TripListItem } from "@/api/types";
import { fmtDateRange, formatMoney } from "@/lib/format";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=60";

export function TripCard({ trip }: { trip: TripListItem }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group block overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,51,102,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,51,102,0.1)]"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={trip.cover_photo_url || FALLBACK_COVER}
          alt={trip.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 card-gradient" />
        <div className="absolute left-3 top-3">
          <StatusPill status={trip.status} />
        </div>
        {trip.is_public && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-ocean-deep" title="Shared publicly">
            <Icon name="public" size={16} />
          </span>
        )}
        <h3 className="absolute bottom-3 left-4 right-4 truncate font-headline-md text-lg font-bold text-white">
          {trip.name}
        </h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <Icon name="calendar_month" size={18} />
          <span className="truncate">{fmtDateRange(trip.start_date, trip.end_date)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
            <Icon name="event" size={18} />
            {trip.num_days} {trip.num_days === 1 ? "day" : "days"}
          </span>
          {trip.total_budget != null && (
            <span className="font-label-sm text-label-sm text-ocean-deep">
              {formatMoney(trip.total_budget, trip.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
