import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// Central query-key registry keeps invalidation consistent across features.
export const qk = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  trips: (params?: unknown) => ["trips", params ?? {}] as const,
  trip: (id: number) => ["trip", id] as const,
  tripBudget: (id: number) => ["trip", id, "budget"] as const,
  tripHealth: (id: number) => ["trip", id, "health"] as const,
  sections: (tripId: number) => ["trip", tripId, "sections"] as const,
  cities: (params?: unknown) => ["cities", params ?? {}] as const,
  city: (id: number) => ["city", id] as const,
  cityActivities: (id: number, params?: unknown) =>
    ["city", id, "activities", params ?? {}] as const,
  activities: (params?: unknown) => ["activities", params ?? {}] as const,
  saved: ["saved"] as const,
  posts: (params?: unknown) => ["posts", params ?? {}] as const,
  post: (id: number) => ["post", id] as const,
  comments: (postId: number) => ["post", postId, "comments"] as const,
  adminOverview: ["admin", "overview"] as const,
  adminUsers: (page: number) => ["admin", "users", page] as const,
  publicTrip: (slug: string) => ["public", "trip", slug] as const,
};
