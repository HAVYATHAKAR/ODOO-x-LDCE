import { del, get, post, put } from "../client";
import type {
  ReorderRequest,
  SectionActivityCreate,
  SectionActivityOut,
  SectionActivityUpdate,
  TripSectionCreate,
  TripSectionOut,
  TripSectionUpdate,
} from "../types";

// All section routes are nested under an owned trip.
export const sectionsApi = {
  list: (tripId: number) => get<TripSectionOut[]>(`/trips/${tripId}/sections`),
  get: (tripId: number, sectionId: number) =>
    get<TripSectionOut>(`/trips/${tripId}/sections/${sectionId}`),
  create: (tripId: number, body: TripSectionCreate) =>
    post<TripSectionOut>(`/trips/${tripId}/sections`, body),
  update: (tripId: number, sectionId: number, body: TripSectionUpdate) =>
    put<TripSectionOut>(`/trips/${tripId}/sections/${sectionId}`, body),
  remove: (tripId: number, sectionId: number) =>
    del(`/trips/${tripId}/sections/${sectionId}`),
  reorder: (tripId: number, ordered_ids: number[]) =>
    put<TripSectionOut[]>(`/trips/${tripId}/sections/reorder`, {
      ordered_ids,
    } satisfies ReorderRequest),

  // ── Section activities ──
  addActivity: (tripId: number, sectionId: number, body: SectionActivityCreate) =>
    post<SectionActivityOut>(`/trips/${tripId}/sections/${sectionId}/activities`, body),
  updateActivity: (
    tripId: number,
    sectionId: number,
    itemId: number,
    body: SectionActivityUpdate,
  ) =>
    put<SectionActivityOut>(
      `/trips/${tripId}/sections/${sectionId}/activities/${itemId}`,
      body,
    ),
  removeActivity: (tripId: number, sectionId: number, itemId: number) =>
    del(`/trips/${tripId}/sections/${sectionId}/activities/${itemId}`),
  reorderActivities: (tripId: number, sectionId: number, ordered_ids: number[]) =>
    put<SectionActivityOut[]>(
      `/trips/${tripId}/sections/${sectionId}/activities/reorder`,
      { ordered_ids } satisfies ReorderRequest,
    ),
};
