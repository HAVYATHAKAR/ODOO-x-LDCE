import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { citiesApi, activitiesApi, savedApi } from "@/api/endpoints/catalog";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/lib/hooks";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, type TabItem } from "@/components/Tabs";
import { TagPill } from "@/components/TagPill";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CityCard } from "@/components/CityCard";
import { SkeletonCard } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { formatMoney } from "@/lib/format";
import { AddToTripModal } from "./AddToTripModal";
import type { ActivityOut } from "@/api/types";

type Mode = "destinations" | "activities";
const PAGE_SIZE = 12;

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("destinations");
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [region, setRegion] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const q = useDebounce(term.trim(), 350);

  // Keep the URL's ?q in sync so the landing-page search lands here correctly.
  useEffect(() => {
    setPage(1);
  }, [q, region, category, mode]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const tabs: TabItem<Mode>[] = [
    { key: "destinations", label: "Destinations", icon: "location_on" },
    { key: "activities", label: "Activities", icon: "local_activity" },
  ];

  return (
    <Container>
      <PageHeader title="Explore" subtitle="Discover destinations and things to do for your next trip." />

      <Tabs tabs={tabs} active={mode} onChange={setMode} className="mt-6" />

      <div className="mt-6">
        <Input
          icon="search"
          placeholder={mode === "destinations" ? "Search cities or countries…" : "Search activities…"}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {mode === "destinations" ? (
        <DestinationsTab q={q} region={region} setRegion={setRegion} page={page} setPage={setPage} />
      ) : (
        <ActivitiesTab q={q} category={category} setCategory={setCategory} page={page} setPage={setPage} />
      )}
    </Container>
  );
}

// ── Pagination footer ────────────────────────────────────────
function Pager({ page, setPage, total }: { page: number; setPage: (n: number) => void; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button variant="outline" size="sm" icon="chevron_left" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Prev
      </Button>
      <span className="text-body-sm text-on-surface-variant">
        Page {page} of {pages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
        Next <Icon name="chevron_right" size={18} />
      </Button>
    </div>
  );
}

// ── Destinations ─────────────────────────────────────────────
function DestinationsTab({
  q,
  region,
  setRegion,
  page,
  setPage,
}: {
  q: string;
  region: string;
  setRegion: (r: string) => void;
  page: number;
  setPage: (n: number) => void;
}) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Distinct regions for filter chips (one unfiltered fetch of the catalog).
  const regionsQuery = useQuery({
    queryKey: qk.cities({ regions: true }),
    queryFn: () => citiesApi.search({ size: 100 }),
  });
  const regions = useMemo(() => {
    const set = new Set<string>();
    regionsQuery.data?.items.forEach((c) => c.region && set.add(c.region));
    return Array.from(set).sort();
  }, [regionsQuery.data]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.cities({ q, region, page }),
    queryFn: () =>
      citiesApi.search({ q: q || undefined, region: region || undefined, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const savedQuery = useQuery({
    queryKey: qk.saved,
    queryFn: () => savedApi.list(),
    enabled: isAuthenticated,
  });
  const savedIds = useMemo(
    () => new Set((savedQuery.data ?? []).map((s) => s.city.id)),
    [savedQuery.data],
  );

  const toggleSave = useMutation({
    mutationFn: async ({ id, saved }: { id: number; saved: boolean }) => {
      if (saved) await savedApi.remove(id);
      else await savedApi.add(id);
    },
    onSuccess: (_d, { saved }) => {
      queryClient.invalidateQueries({ queryKey: qk.saved });
      toast.success(saved ? "Removed from saved" : "Saved destination");
    },
    onError: () => toast.error("Could not update saved destinations"),
  });

  const onToggle = (id: number) => {
    if (!isAuthenticated) {
      toast.info("Log in to save destinations");
      return;
    }
    toggleSave.mutate({ id, saved: savedIds.has(id) });
  };

  const items = data?.items ?? [];

  return (
    <div className="mt-5">
      {regions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <TagPill active={region === ""} onClick={() => setRegion("")}>
            All regions
          </TagPill>
          {regions.map((r) => (
            <TagPill key={r} active={region === r} onClick={() => setRegion(region === r ? "" : r)}>
              {r}
            </TagPill>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="search_off" title="No destinations found" description="Try a different search or region filter." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((c) => (
              <CityCard
                key={c.id}
                city={c}
                saved={savedIds.has(c.id)}
                savingBusy={toggleSave.isPending}
                onToggleSave={() => onToggle(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Pager page={page} setPage={setPage} total={data?.total ?? 0} />
    </div>
  );
}

// ── Activities ───────────────────────────────────────────────
function ActivitiesTab({
  q,
  category,
  setCategory,
  page,
  setPage,
}: {
  q: string;
  category: string;
  setCategory: (c: string) => void;
  page: number;
  setPage: (n: number) => void;
}) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [addTarget, setAddTarget] = useState<ActivityOut | null>(null);

  const catsQuery = useQuery({
    queryKey: qk.activities({ categories: true }),
    queryFn: () => activitiesApi.search({ size: 100 }),
  });
  const categories = useMemo(() => {
    const set = new Set<string>();
    catsQuery.data?.items.forEach((a) => a.category && set.add(a.category));
    return Array.from(set).sort();
  }, [catsQuery.data]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.activities({ q, category, page }),
    queryFn: () =>
      activitiesApi.search({
        q: q || undefined,
        category: category || undefined,
        page,
        size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const openAdd = (a: ActivityOut) => {
    if (!isAuthenticated) {
      toast.info("Log in to add activities to a trip");
      return;
    }
    setAddTarget(a);
  };

  const items = data?.items ?? [];

  return (
    <div className="mt-5">
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <TagPill active={category === ""} onClick={() => setCategory("")}>
            All categories
          </TagPill>
          {categories.map((c) => (
            <TagPill key={c} active={category === c} onClick={() => setCategory(category === c ? "" : c)}>
              {c}
            </TagPill>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="search_off" title="No activities found" description="Try a different search or category." />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ActivityCard key={a.id} activity={a} onAdd={() => openAdd(a)} />
            ))}
          </div>
        </div>
      )}

      <Pager page={page} setPage={setPage} total={data?.total ?? 0} />

      {addTarget && (
        <AddToTripModal open onClose={() => setAddTarget(null)} activity={addTarget} />
      )}
    </div>
  );
}

const FALLBACK_ACTIVITY =
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=60";

export function ActivityCard({ activity, onAdd }: { activity: ActivityOut; onAdd: () => void }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,51,102,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,51,102,0.1)]">
      <div className="relative h-40 overflow-hidden">
        <img
          src={activity.image_url || FALLBACK_ACTIVITY}
          alt={activity.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-caption font-semibold capitalize text-ocean-deep">
          {activity.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-headline-md text-lg font-bold text-ocean-deep">{activity.name}</h3>
        {activity.description && (
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{activity.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1 font-semibold text-secondary">
              <Icon name="payments" size={16} /> {formatMoney(activity.estimated_cost)}
            </span>
            {activity.duration_minutes != null && (
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={16} /> {activity.duration_minutes}m
              </span>
            )}
          </div>
          <Button size="sm" icon="add" onClick={onAdd}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
