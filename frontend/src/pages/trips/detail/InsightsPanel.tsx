import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { PageSpinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import type { ApiError, HealthInsight } from "@/api/types";

const SEVERITY: Record<HealthInsight["severity"], { icon: string; cls: string }> = {
  info: { icon: "info", cls: "border-ocean-deep/20 bg-sky-tint text-ocean-deep" },
  warning: { icon: "warning", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  critical: { icon: "error", cls: "border-error/20 bg-error-container text-on-error-container" },
};

function ratingColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#FF8C00";
  if (score >= 40) return "#f59e0b";
  return "#ba1a1a";
}

export function InsightsPanel({
  tripId,
  editable,
}: {
  tripId: number;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: qk.tripHealth(tripId),
    queryFn: () => tripsApi.health(tripId),
  });

  const moveIt = useMutation({
    mutationFn: () => tripsApi.moveItForMe(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trip(tripId) });
      queryClient.invalidateQueries({ queryKey: qk.tripBudget(tripId) });
      queryClient.invalidateQueries({ queryKey: qk.tripHealth(tripId) });
      toast.success("We tidied up your schedule");
    },
    onError: (err) => toast.error((err as ApiError).detail || "Couldn't auto-fix"),
  });

  if (isLoading) return <PageSpinner label="Checking your plan…" />;
  if (error) return <Alert tone="danger">{(error as ApiError).detail}</Alert>;
  if (!data) return null;

  const score = Math.round(data.overall_score);
  const color = ratingColor(score);
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 sm:flex-row sm:items-center">
        {/* Score ring */}
        <div className="relative h-32 w-32 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e1e3e4" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display-lg text-3xl font-bold text-ocean-deep">{score}</span>
            <span className="text-caption text-on-surface-variant">/ 100</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-caption font-semibold uppercase tracking-wide text-on-surface-variant">
            Trip health
          </p>
          <h3 className="font-display-lg text-2xl font-bold capitalize text-ocean-deep">{data.rating}</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {data.insights.length === 0
              ? "Everything looks great — no issues found."
              : `${data.insights.length} thing${data.insights.length === 1 ? "" : "s"} to review.`}
          </p>
          {editable && (
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              icon="auto_fix_high"
              loading={moveIt.isPending}
              onClick={() => moveIt.mutate()}
            >
              Move it for me
            </Button>
          )}
        </div>
      </div>

      {data.insights.length === 0 ? (
        <EmptyState
          icon="verified"
          title="No issues found"
          description="Your itinerary has no scheduling gaps, overlaps, or budget concerns."
        />
      ) : (
        <ul className="space-y-3">
          {data.insights.map((ins, i) => {
            const s = SEVERITY[ins.severity] ?? SEVERITY.info;
            return (
              <li key={`${ins.code}-${i}`} className={cn("flex gap-3 rounded-xl border p-4", s.cls)}>
                <Icon name={s.icon} size={22} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{ins.message}</p>
                  {ins.action && <p className="mt-0.5 text-body-sm opacity-90">{ins.action}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
