import { get, post } from "../client";
import type { PublicTripOut, TripDetail } from "../types";

// Public share view is unauthenticated; copy requires a logged-in user.
export const publicApi = {
  getTrip: (slug: string) => get<PublicTripOut>(`/public/trips/${slug}`),
  copyTrip: (slug: string) => post<TripDetail>(`/public/trips/${slug}/copy`),
};
