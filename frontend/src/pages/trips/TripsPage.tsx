import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Tabs, type TabItem } from "@/components/Tabs";
import { TripCard } from "@/components/TripCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import { Alert } from "@/components/Alert";
import type { ApiError, TripStatus } from "@/api/types";

type Filter = "all" | TripStatus;
const TABS: TabItem<Filter>[] = [
  { key: "all", label: "All", icon: "apps" },
  { key: "upcoming", label: "Upcoming", icon: "flight_takeoff" },
  { key: "ongoing", label: "Ongoing", icon: "explore" },
  { key: "completed", label: "Completed", icon: "check_circle" },
];
const PAGE_SIZE = 12;

export function TripsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const params = {
    status: filter === "all" ? undefined : filter,
    page,
    size: PAGE_SIZE,
  };
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: qk.trips(params),
    queryFn: () => tripsApi.list(params),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <Container>
      <PageHeader
        title="My Trips"
        subtitle="All your adventures in one place."
        actions={
          <Link to="/trips/new">
            <Button icon="add">New Trip</Button>
          </Link>
        }
      />

      <div className="mt-6">
        <Tabs tabs={TABS} active={filter} onChange={changeFilter} />
      </div>

      {error && (
        <Alert tone="danger" className="mt-6">
          {(error as ApiError).detail}
        </Alert>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                icon="chevron_left"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-body-sm text-on-surface-variant">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          className="mt-6"
          icon="luggage"
          title={filter === "all" ? "No trips yet" : `No ${filter} trips`}
          description="Create your first trip to start building an itinerary."
          action={
            <Link to="/trips/new">
              <Button icon="add">Plan a trip</Button>
            </Link>
          }
        />
      )}
    </Container>
  );
}
