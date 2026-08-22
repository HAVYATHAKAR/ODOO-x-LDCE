import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { StatusPill } from "@/components/StatusPill";
import { Tabs, type TabItem } from "@/components/Tabs";
import { PageSpinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { fmtDateRange, formatMoney } from "@/lib/format";
import { ItineraryPanel } from "./detail/ItineraryPanel";
import { BudgetPanel } from "./detail/BudgetPanel";
import { CalendarPanel } from "./detail/CalendarPanel";
import { InsightsPanel } from "./detail/InsightsPanel";
import { ShareModal } from "./detail/ShareModal";
import type { ApiError } from "@/api/types";

type Tab = "itinerary" | "calendar" | "budget" | "insights";
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=70";

export function TripDetailPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("itinerary");
  const [shareOpen, setShareOpen] = useState(false);

  const { data: trip, isLoading, error } = useQuery({
    queryKey: qk.trip(tripId),
    queryFn: () => tripsApi.get(tripId),
    enabled: Number.isFinite(tripId),
  });

  if (isLoading) return <PageSpinner label="Loading trip…" />;

  if (error || !trip) {
    const status = (error as ApiError | undefined)?.code;
    return (
      <Container>
        <EmptyState
          icon={status === "403" ? "lock" : "error"}
          title={status === "403" ? "You don't have access" : "Trip not found"}
          description={
            status === "403"
              ? "This trip belongs to another traveler."
              : "This trip may have been deleted or the link is incorrect."
          }
          action={
            <Link to="/trips">
              <Button icon="arrow_back">Back to my trips</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const editable = user?.id === trip.user_id;
  const tabs: TabItem<Tab>[] = [
    { key: "itinerary", label: "Itinerary", icon: "map", count: trip.sections.length },
    { key: "calendar", label: "Calendar", icon: "calendar_month" },
    { key: "budget", label: "Budget", icon: "payments" },
    { key: "insights", label: "Insights", icon: "insights" },
  ];

  return (
    <div>
      {/* Hero header */}
      <div className="relative h-56 w-full overflow-hidden sm:h-64">
        <img
          src={trip.cover_photo_url || FALLBACK_COVER}
          alt={trip.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-x-0 bottom-0">
          <Container className="!py-5">
            <Link
              to="/trips"
              className="mb-3 inline-flex items-center gap-1 text-body-sm font-semibold text-white/90 hover:text-white"
            >
              <Icon name="arrow_back" size={18} /> My Trips
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <StatusPill status={trip.status} />
                  {trip.is_public && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-caption font-semibold text-ocean-deep">
                      <Icon name="public" size={14} /> Public
                    </span>
                  )}
                </div>
                <h1 className="font-display-lg text-3xl font-bold text-white sm:text-4xl">{trip.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-body-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <Icon name="calendar_month" size={18} />
                    {fmtDateRange(trip.start_date, trip.end_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="event" size={18} />
                    {trip.num_days} days
                  </span>
                  {trip.total_budget != null && (
                    <span className="flex items-center gap-1">
                      <Icon name="payments" size={18} />
                      {formatMoney(trip.total_budget, trip.currency)}
                    </span>
                  )}
                </div>
              </div>
              {editable && (
                <div className="flex items-center gap-2">
                  <Button variant="white" icon="share" onClick={() => setShareOpen(true)}>
                    Share
                  </Button>
                  <Link to={`/trips/${trip.id}/settings`}>
                    <Button variant="white" icon="settings">
                      Settings
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Container>
        </div>
      </div>

      <Container>
        {trip.description && (
          <p className="mb-6 max-w-3xl text-body-md text-on-surface-variant">{trip.description}</p>
        )}

        <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

        {tab === "itinerary" && <ItineraryPanel trip={trip} editable={editable} />}
        {tab === "calendar" && <CalendarPanel trip={trip} />}
        {tab === "budget" && <BudgetPanel tripId={trip.id} currency={trip.currency} />}
        {tab === "insights" && <InsightsPanel tripId={trip.id} editable={editable} />}
      </Container>

      {editable && <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} trip={trip} />}
    </div>
  );
}
