import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { citiesApi, savedApi } from "@/api/endpoints/catalog";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/Badge";
import { TagPill } from "@/components/TagPill";
import { PageSpinner } from "@/components/Spinner";
import { SkeletonCard } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AddToTripModal } from "./AddToTripModal";
import { ActivityCard } from "./ExplorePage";
import type { ActivityOut, ApiError } from "@/api/types";

const FALLBACK_CITY =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=70";

export function CityDetailPage() {
  const { id } = useParams();
  const cityId = Number(id);
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [addTarget, setAddTarget] = useState<ActivityOut | null>(null);

  const { data: city, isLoading, error } = useQuery({
    queryKey: qk.city(cityId),
    queryFn: () => citiesApi.get(cityId),
    enabled: Number.isFinite(cityId),
  });

  const { data: activities, isLoading: actLoading } = useQuery({
    queryKey: qk.cityActivities(cityId, {}),
    queryFn: () => citiesApi.activities(cityId, { size: 100 }),
    enabled: Number.isFinite(cityId),
  });

  const savedQuery = useQuery({
    queryKey: qk.saved,
    queryFn: () => savedApi.list(),
    enabled: isAuthenticated,
  });
  const isSaved = useMemo(
    () => (savedQuery.data ?? []).some((s) => s.city.id === cityId),
    [savedQuery.data, cityId],
  );

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (isSaved) await savedApi.remove(cityId);
      else await savedApi.add(cityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.saved });
      toast.success(isSaved ? "Removed from saved" : "Saved destination");
    },
    onError: () => toast.error("Could not update saved destinations"),
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    activities?.items.forEach((a) => a.category && set.add(a.category));
    return Array.from(set).sort();
  }, [activities]);

  const shownActivities = useMemo(() => {
    const all = activities?.items ?? [];
    return category ? all.filter((a) => a.category === category) : all;
  }, [activities, category]);

  if (isLoading) return <PageSpinner label="Loading destination…" />;

  if (error || !city) {
    return (
      <Container>
        <EmptyState
          icon="wrong_location"
          title="Destination not found"
          description={(error as ApiError)?.detail || "This city may not exist."}
          action={
            <Link to="/explore">
              <Button icon="travel_explore">Back to explore</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const onSave = () => {
    if (!isAuthenticated) {
      toast.info("Log in to save destinations");
      return;
    }
    toggleSave.mutate();
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <img src={city.image_url || FALLBACK_CITY} alt={city.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-x-0 bottom-0">
          <Container className="!py-6">
            <Link
              to="/explore"
              className="mb-3 inline-flex items-center gap-1 text-body-sm font-semibold text-white/90 hover:text-white"
            >
              <Icon name="arrow_back" size={18} /> Explore
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display-lg text-4xl font-bold text-white">{city.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-body-md text-white/90">
                  <Icon name="location_on" size={18} /> {city.country}
                  {city.region ? ` · ${city.region}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="white"
                  icon="favorite"
                  iconFill={isSaved}
                  loading={toggleSave.isPending}
                  onClick={onSave}
                >
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Link to="/trips/new">
                  <Button icon="add">Plan a trip</Button>
                </Link>
              </div>
            </div>
          </Container>
        </div>
      </div>

      <Container>
        {/* Facts */}
        <div className="flex flex-wrap gap-2">
          <Badge tone="sky" icon="trending_up">
            Popularity {city.popularity_score}
          </Badge>
          <Badge tone="sunset" icon="payments">
            Cost index {city.cost_index}
          </Badge>
        </div>

        {city.description && (
          <p className="mt-4 max-w-3xl text-body-md text-on-surface-variant">{city.description}</p>
        )}

        {/* Activities */}
        <div className="mt-10">
          <h2 className="font-display-lg text-2xl font-bold text-ocean-deep">Things to do</h2>

          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <TagPill active={category === ""} onClick={() => setCategory("")}>
                All
              </TagPill>
              {categories.map((c) => (
                <TagPill key={c} active={category === c} onClick={() => setCategory(category === c ? "" : c)}>
                  {c}
                </TagPill>
              ))}
            </div>
          )}

          <div className="mt-6">
            {actLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : shownActivities.length === 0 ? (
              <EmptyState
                icon="local_activity"
                title="No activities listed yet"
                description="There are no catalog activities for this destination right now."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shownActivities.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    onAdd={() => {
                      if (!isAuthenticated) {
                        toast.info("Log in to add activities to a trip");
                        return;
                      }
                      setAddTarget(a);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      {addTarget && <AddToTripModal open onClose={() => setAddTarget(null)} activity={addTarget} />}
    </div>
  );
}
