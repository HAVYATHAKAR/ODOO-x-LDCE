import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { formatMoney, toNumber } from "@/lib/format";
import { PageSpinner } from "@/components/Spinner";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/Icon";
import { SECTION_META } from "./section-meta";
import type { ApiError, SectionType } from "@/api/types";

const CHART_COLORS = ["#003366", "#FF8C00", "#00A6E5", "#904D00", "#22c55e", "#737780", "#a855f7"];

function label(key: string): string {
  return (SECTION_META as Record<string, { label: string }>)[key]?.label ?? key;
}

export function BudgetPanel({ tripId, currency }: { tripId: number; currency: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.tripBudget(tripId),
    queryFn: () => tripsApi.budget(tripId),
  });

  if (isLoading) return <PageSpinner label="Crunching your budget…" />;
  if (error) return <Alert tone="danger">{(error as ApiError).detail}</Alert>;
  if (!data) return null;

  const planned = toNumber(data.total_planned);
  const actual = toNumber(data.total_actual);
  const target = data.target_budget != null ? toNumber(data.target_budget) : null;
  const perDay = data.per_day != null ? toNumber(data.per_day) : null;

  const breakdownEntries = Object.entries(data.breakdown).filter(
    ([, v]) => toNumber(v.planned) > 0 || toNumber(v.actual) > 0,
  );

  const pieData = breakdownEntries.map(([key, v]) => ({
    name: label(key),
    value: toNumber(v.planned) || toNumber(v.actual),
  }));
  const barData = breakdownEntries.map(([key, v]) => ({
    name: label(key as SectionType),
    Planned: toNumber(v.planned),
    Actual: toNumber(v.actual),
  }));

  const overTarget = target != null && planned > target;

  const tiles = [
    { label: "Target", value: target != null ? formatMoney(target, currency) : "—", icon: "flag", tone: "text-ocean-deep" },
    { label: "Planned", value: formatMoney(planned, currency), icon: "receipt_long", tone: "text-sunset-action" },
    { label: "Logged spend", value: formatMoney(actual, currency), icon: "payments", tone: "text-green-600" },
    {
      label: "Per day",
      value: perDay != null ? formatMoney(perDay, currency) : "—",
      icon: "today",
      tone: "text-ocean-deep",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name={t.icon} size={18} className={t.tone} />
              <span className="text-caption font-semibold">{t.label}</span>
            </div>
            <p className="mt-2 font-display-lg text-xl font-bold text-ocean-deep">{t.value}</p>
          </div>
        ))}
      </div>

      {/* Target progress */}
      {target != null && (
        <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5">
          <div className="flex items-center justify-between text-body-sm">
            <span className="font-semibold text-on-surface">Planned vs target</span>
            <span className={overTarget ? "font-semibold text-error" : "text-on-surface-variant"}>
              {formatMoney(planned, currency)} / {formatMoney(target, currency)}
            </span>
          </div>
          <ProgressBar className="mt-3" value={planned} max={target} warnOnOver />
          {data.variance != null && (
            <p className="mt-2 text-caption text-on-surface-variant">
              {overTarget ? "Over budget by " : "Remaining "}
              <span className={overTarget ? "font-semibold text-error" : "font-semibold text-green-600"}>
                {formatMoney(Math.abs(toNumber(data.variance)), currency)}
              </span>
            </p>
          )}
        </div>
      )}

      {breakdownEntries.length === 0 ? (
        <EmptyState
          icon="donut_small"
          title="No budget data yet"
          description="Add activities with expenses or set section budgets to see the breakdown."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie: distribution */}
          <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5">
            <h3 className="font-headline-md text-lg font-bold text-ocean-deep">Where it goes</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v, currency)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar: planned vs actual */}
          <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5">
            <h3 className="font-headline-md text-lg font-bold text-ocean-deep">Planned vs actual</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatMoney(v, currency)} />
                  <Legend />
                  <Bar dataKey="Planned" fill="#003366" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#FF8C00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
