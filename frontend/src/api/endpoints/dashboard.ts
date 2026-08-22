import { get } from "../client";
import type { DashboardResponse } from "../types";

export const dashboardApi = {
  get: () => get<DashboardResponse>("/dashboard"),
};
