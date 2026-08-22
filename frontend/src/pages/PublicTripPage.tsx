import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { publicApi } from "@/api/endpoints/public";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/Badge";
import { StatusPill } from "@/components/StatusPill";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { PageSpinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { sectionMeta } from "@/pages/trips/detail/section-meta";
import { fmtDate, fmtDateRange, formatMoney, fullName } from "@/lib/format";
import type { ApiError, TripSectionOut } from "@/api/types";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=70";

export function PublicTripPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { data: trip, isLoading, error } = useQuery({
    queryKey: qk.publicTrip(slug ?? ""),
    queryFn: () => publicApi.getTrip(slug!),
    enabled: !!slug,
  });

  const copy = useMutation({
    mutationFn: () => publicApi.copyTrip(slug!),
    onSuccess: (created) => {
      toast.success("Trip copied to your account");
      navigate(`/trips/${created.id}`);
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not copy trip"),
  });

  if (isLoading) return <PageSpinner label="Loading trip…" />;

  if (error || !trip) {
    return (
      <Container>
        <EmptyState
          icon="link_off"
          title="Trip not available"
          description="This shared trip is private or the link is no longer valid."
          action={
            <Link to="/explore">
              <Button icon="travel_explore">Explore destinations</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const onCopy = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    copy.mutate();
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        <img src={trip.cover_photo_url || FALLBACK_COVER} alt={trip.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-x-0 bottom-0">
          <Container className="!py-6">
            <div className="mb-2 flex items-center gap-2">
              <StatusPill status={trip.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-caption font-semibold text-ocean-deep">
                <Icon name="public" size={14} /> Shared trip
              </span>
            </div>
            <h1 className="font-display-lg text-4xl font-bold text-white">{trip.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-body-sm text-white/90">
              <span className="flex items-center gap-1">
                <Icon name="calendar_month" size={18} /> {fmtDateRange(trip.start_date, trip.end_date)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="event" size={18} /> {trip.num_days} days
              </span>
              {trip.show_budget && trip.total_budget != null && (
                <span className="flex items-center gap-1">
                  <Icon name="payments" size={18} /> {formatMoney(trip.total_budget, trip.currency)}
                </span>
              )}
            </div>
          </Container>
        </div>
      </div>

      <Container>
        {/* Owner + copy */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar user={trip.owner} size={44} />
            <div>
              <p className="text-caption text-on-surface-variant">Planned by</p>
              <p className="font-semibold text-on-surface">{fullName(trip.owner)}</p>
            </div>
          </div>
          <Button icon="content_copy" loading={copy.isPending} onClick={onCopy}>
            {isAuthenticated ? "Copy this trip" : "Log in to copy"}
          </Button>
        </div>

        {trip.description && (
          <p className="mt-6 max-w-3xl text-body-md text-on-surface-variant">{trip.description}</p>
        )}

        {/* Itinerary (read-only) */}
        <h2 className="mb-4 mt-10 font-display-lg text-2xl font-bold text-ocean-deep">Itinerary</h2>
        {trip.sections.length === 0 ? (
          <EmptyState icon="map" title="No itinerary yet" description="This trip doesn't have any planned sections." />
        ) : (
          <div className="space-y-4">
            {trip.sections.map((s) => (
              <ReadOnlySection key={s.id} section={s} currency={trip.currency} showBudget={trip.show_budget} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function ReadOnlySection({
  section,
  currency,
  showBudget,
}: {
  section: TripSectionOut;
  currency: string;
  showBudget: boolean;
}) {
  const meta = sectionMeta(section.section_type);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-surface-variant p-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}>
          <Icon name={meta.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-headline-md text-lg font-bold text-ocean-deep">{section.title}</h3>
            <Badge tone="neutral">{meta.label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
            {section.city && (
              <span className="flex items-center gap-1">
                <Icon name="location_on" size={16} /> {section.city.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="calendar_month" size={16} /> {fmtDateRange(section.start_date, section.end_date)}
            </span>
            {showBudget && (
              <span className="flex items-center gap-1">
                <Icon name="payments" size={16} /> {formatMoney(section.budget, currency)}
              </span>
            )}
          </div>
        </div>
      </div>

      {section.activities.length > 0 && (
        <ul className="divide-y divide-surface-variant">
          {section.activities.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-on-surface">{a.display_name}</p>
                <p className="text-caption text-on-surface-variant">
                  {fmtDate(a.scheduled_date)}
                  {a.scheduled_time ? ` · ${a.scheduled_time.slice(0, 5)}` : ""}
                </p>
              </div>
              {showBudget && (
                <span className="shrink-0 text-body-sm font-semibold text-secondary">
                  {formatMoney(a.expense, currency)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
