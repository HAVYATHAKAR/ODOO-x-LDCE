import { del, get, post, put } from "../client";
import type {
  BudgetSummary,
  Page,
  ShareResponse,
  TripCreate,
  TripDetail,
  TripHealth,
  TripListItem,
  TripStatus,
  TripUpdate,
} from "../types";

export interface TripListParams {
  status?: TripStatus;
  page?: number;
  size?: number;
}

export const tripsApi = {
  list: (params: TripListParams = {}) =>
    get<Page<TripListItem>>("/trips", { params }),
  get: (id: number) => get<TripDetail>(`/trips/${id}`),
  create: (body: TripCreate) => post<TripDetail>("/trips", body),
  update: (id: number, body: TripUpdate) => put<TripDetail>(`/trips/${id}`, body),
  remove: (id: number) => del(`/trips/${id}`),

  budget: (id: number) => get<BudgetSummary>(`/trips/${id}/budget`),
  health: (id: number) => get<TripHealth>(`/trips/${id}/health`),
  moveItForMe: (id: number) => post<TripHealth>(`/trips/${id}/health/move-it-for-me`),

  share: (id: number) => post<ShareResponse>(`/trips/${id}/share`),
  unshare: (id: number) => del<ShareResponse>(`/trips/${id}/share`),
};
