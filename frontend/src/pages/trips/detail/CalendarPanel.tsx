import { eachDayOfInterval, format, parseISO } from "date-fns";

import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { sectionMeta } from "./section-meta";
import type { SectionActivityOut, TripDetail } from "@/api/types";

interface DayActivity extends SectionActivityOut {
  sectionTitle: string;
  sectionType: ReturnType<typeof sectionMeta>;
}

export function CalendarPanel({ trip }: { trip: TripDetail }) {
  // Bucket every activity by its scheduled date.
  const byDate = new Map<string, DayActivity[]>();
  for (const section of trip.sections) {
    const meta = sectionMeta(section.section_type);
    for (const act of section.activities) {
      const key = act.scheduled_date;
      const list = byDate.get(key) ?? [];
      list.push({ ...act, sectionTitle: section.title, sectionType: meta });
      byDate.set(key, list);
    }
  }

  let days: Date[] = [];
  try {
    days = eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) });
  } catch {
    days = [];
  }

  const totalActivities = Array.from(byDate.values()).reduce((n, l) => n + l.length, 0);
  if (totalActivities === 0) {
    return (
      <EmptyState
        icon="calendar_month"
        title="Nothing scheduled yet"
        description="Activities you add to your itinerary will appear here, organized by day."
      />
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day, index) => {
        const key = format(day, "yyyy-MM-dd");
        const items = (byDate.get(key) ?? []).sort((a, b) =>
          (a.scheduled_time ?? "99").localeCompare(b.scheduled_time ?? "99"),
        );
        return (
          <div
            key={key}
            className="flex gap-4 rounded-2xl border border-surface-variant bg-surface-container-lowest p-4"
          >
            {/* Day marker */}
            <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-ocean-deep py-3 text-white">
              <span className="text-caption uppercase opacity-80">{format(day, "EEE")}</span>
              <span className="font-display-lg text-2xl font-bold leading-none">{format(day, "d")}</span>
              <span className="text-caption opacity-80">{format(day, "MMM")}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold text-on-surface-variant">
                Day {index + 1}
              </p>
              {items.length === 0 ? (
                <p className="mt-2 text-body-sm text-outline">No plans — a free day.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl bg-surface-container-low px-3 py-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.sectionType.chip}`}>
                        <Icon name={item.sectionType.icon} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-md font-medium text-on-surface">{item.display_name}</p>
                        <p className="truncate text-caption text-on-surface-variant">{item.sectionTitle}</p>
                      </div>
                      {item.scheduled_time && (
                        <span className="shrink-0 text-caption font-semibold text-ocean-deep">
                          {item.scheduled_time.slice(0, 5)}
                        </span>
                      )}
                      {Number(item.expense) > 0 && (
                        <span className="shrink-0 text-caption text-on-surface-variant">
                          {formatMoney(item.expense, trip.currency)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
