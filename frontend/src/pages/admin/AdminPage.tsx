import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { adminApi } from "@/api/endpoints/admin";
import { qk } from "@/lib/queryClient";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { Skeleton } from "@/components/Skeleton";
import { PageSpinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { fmtDate, formatCompact, fullName } from "@/lib/format";
import type { ApiError } from "@/api/types";

const USERS_PAGE_SIZE = 20;

const STAT_META: { key: keyof StatCounts; label: string; icon: string; tone: string }[] = [
  { key: "user_count", label: "Users", icon: "group", tone: "bg-sky-tint text-ocean-deep" },
  { key: "trip_count", label: "Trips", icon: "luggage", tone: "bg-sunset-action/15 text-secondary" },
  { key: "public_trip_count", label: "Public trips", icon: "public", tone: "bg-green-100 text-green-700" },
  { key: "city_count", label: "Cities", icon: "location_city", tone: "bg-purple-100 text-purple-700" },
  { key: "activity_count", label: "Activities", icon: "local_activity", tone: "bg-amber-100 text-amber-700" },
  { key: "post_count", label: "Posts", icon: "forum", tone: "bg-ocean-deep/10 text-ocean-deep" },
];

type StatCounts = {
  user_count: number;
  trip_count: number;
  public_trip_count: number;
  city_count: number;
  activity_count: number;
  post_count: number;
};

export function AdminPage() {
  const [page, setPage] = useState(1);

  const { data: overview, isLoading, error } = useQuery({
    queryKey: qk.adminOverview,
    queryFn: () => adminApi.overview(),
  });

  const usersQuery = useQuery({
    queryKey: qk.adminUsers(page),
    queryFn: () => adminApi.listUsers(page, USERS_PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <PageSpinner label="Loading admin dashboard…" />;

  if (error || !overview) {
    return (
      <Container>
        <EmptyState
          icon="admin_panel_settings"
          title="Couldn't load admin data"
          description={(error as ApiError)?.detail || "Try again shortly."}
        />
      </Container>
    );
  }

  const users = usersQuery.data?.items ?? [];
  const userPages = Math.max(1, Math.ceil((usersQuery.data?.total ?? 0) / USERS_PAGE_SIZE));

  return (
    <Container>
      <PageHeader title="Admin dashboard" subtitle="Platform-wide usage and management." />

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {STAT_META.map((s) => (
          <Card key={s.key} className="p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
              <Icon name={s.icon} size={22} />
            </span>
            <p className="mt-3 font-display-lg text-2xl font-bold text-ocean-deep">
              {formatCompact(overview[s.key])}
            </p>
            <p className="text-body-sm text-on-surface-variant">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Popular cities / activities */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-headline-md text-lg font-bold text-ocean-deep">Most-used destinations</h2>
          {overview.popular_cities.length === 0 ? (
            <p className="mt-4 text-body-sm text-on-surface-variant">No usage data yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {overview.popular_cities.map((pc, i) => (
                <li key={pc.city.id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-outline">{i + 1}</span>
                  <img
                    src={pc.city.image_url || "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=200&q=60"}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-on-surface">{pc.city.name}</p>
                    <p className="text-caption text-on-surface-variant">{pc.city.country}</p>
                  </div>
                  <Badge tone="sky">{pc.usage_count} trips</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-headline-md text-lg font-bold text-ocean-deep">Most-used activities</h2>
          {overview.popular_activities.length === 0 ? (
            <p className="mt-4 text-body-sm text-on-surface-variant">No usage data yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {overview.popular_activities.map((pa, i) => (
                <li key={pa.activity.id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-outline">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-on-surface">{pa.activity.name}</p>
                    <p className="text-caption capitalize text-on-surface-variant">{pa.activity.category}</p>
                  </div>
                  <Badge tone="sunset">{pa.usage_count} uses</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Users table */}
      <Card className="mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-variant p-6">
          <h2 className="font-headline-md text-lg font-bold text-ocean-deep">Users</h2>
          <span className="text-body-sm text-on-surface-variant">{usersQuery.data?.total ?? 0} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-variant text-caption uppercase tracking-wide text-on-surface-variant">
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {usersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={u} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-on-surface">{fullName(u)}</p>
                          <p className="text-caption text-on-surface-variant">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.is_admin ? <Badge tone="ocean" icon="shield">Admin</Badge> : <Badge tone="neutral">Member</Badge>}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{fmtDate(u.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {userPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-surface-variant p-4">
            <Button variant="outline" size="sm" icon="chevron_left" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Prev
            </Button>
            <span className="text-body-sm text-on-surface-variant">
              Page {page} of {userPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= userPages} onClick={() => setPage(page + 1)}>
              Next <Icon name="chevron_right" size={18} />
            </Button>
          </div>
        )}
      </Card>
    </Container>
  );
}
