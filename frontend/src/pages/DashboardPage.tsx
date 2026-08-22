import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/api/endpoints/dashboard";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { TripCard } from "@/components/TripCard";
import { CityCard } from "@/components/CityCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import { Alert } from "@/components/Alert";
import { fullName } from "@/lib/format";
import type { ApiError } from "@/api/types";

const STATS = [
  { key: "total", label: "Total Trips", icon: "luggage", tone: "bg-ocean-deep" },
  { key: "upcoming", label: "Upcoming", icon: "flight_takeoff", tone: "bg-sunset-action" },
  { key: "ongoing", label: "Ongoing", icon: "explore", tone: "bg-green-500" },
  { key: "completed", label: "Completed", icon: "check_circle", tone: "bg-outline" },
] as const;

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: qk.dashboard,
    queryFn: dashboardApi.get,
  });

  return (
    <Container>
      <PageHeader
        title={`Hi, ${user ? fullName(user).split(" ")[0] : "traveler"} 👋`}
        subtitle="Here's what's happening with your travels."
        actions={
          <Link to="/trips/new">
            <Button icon="add">New Trip</Button>
          </Link>
        }
      />

      {error && (
        <Alert tone="danger" className="mt-6">
          {(error as ApiError).detail}
        </Alert>
      )}

      {/* KPI tiles */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-4 rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_20px_rgba(0,51,102,0.08)]"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${s.tone}`}>
              <Icon name={s.icon} size={24} />
            </span>
            <div>
              <p className="font-display-lg text-2xl font-bold text-ocean-deep">
                {isLoading ? "—" : (data?.counts[s.key] ?? 0)}
              </p>
              <p className="text-body-sm text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming trips */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-ocean-deep">Upcoming trips</h2>
          <Link to="/trips" className="text-body-sm font-semibold text-ocean-deep hover:underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data && data.upcoming_trips.length > 0 ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcoming_trips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon="flight_takeoff"
            title="No upcoming trips yet"
            description="Start planning your next adventure and it'll show up here."
            action={
              <Link to="/trips/new">
                <Button icon="add">Plan a trip</Button>
              </Link>
            }
          />
        )}
      </section>

      {/* Recent trips */}
      {data && data.recent_trips.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline-md text-headline-md text-ocean-deep">Recently created</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent_trips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        </section>
      )}

      {/* Popular cities */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-ocean-deep">Popular destinations</h2>
          <Link to="/explore" className="text-body-sm font-semibold text-ocean-deep hover:underline">
            Explore
          </Link>
        </div>
        {isLoading ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data?.popular_cities.map((c) => (
              <CityCard key={c.id} city={c} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
