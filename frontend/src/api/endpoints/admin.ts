import { get } from "../client";
import type { AdminOverview, Page, UserProfile } from "../types";

export const adminApi = {
  overview: () => get<AdminOverview>("/admin/overview"),
  listUsers: (page = 1, size = 20) =>
    get<Page<UserProfile>>("/admin/users", { params: { page, size } }),
};
