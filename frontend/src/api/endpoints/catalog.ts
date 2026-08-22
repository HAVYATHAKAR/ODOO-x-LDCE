import { del, get, post } from "../client";
import type { ActivityOut, CityOut, Page, SavedOut } from "../types";

export interface CitySearchParams {
  q?: string;
  region?: string;
  country?: string;
  page?: number;
  size?: number;
}

export interface ActivitySearchParams {
  city_id?: number;
  category?: string;
  q?: string;
  max_cost?: number;
  page?: number;
  size?: number;
}

export const citiesApi = {
  search: (params: CitySearchParams = {}) => get<Page<CityOut>>("/cities", { params }),
  get: (id: number) => get<CityOut>(`/cities/${id}`),
  activities: (cityId: number, params: Omit<ActivitySearchParams, "city_id"> = {}) =>
    get<Page<ActivityOut>>(`/cities/${cityId}/activities`, { params }),
};

export const activitiesApi = {
  search: (params: ActivitySearchParams = {}) =>
    get<Page<ActivityOut>>("/activities", { params }),
  get: (id: number) => get<ActivityOut>(`/activities/${id}`),
};

export const savedApi = {
  list: () => get<SavedOut[]>("/saved"),
  add: (city_id: number) => post<SavedOut>("/saved", { city_id }),
  remove: (cityId: number) => del(`/saved/${cityId}`),
};
