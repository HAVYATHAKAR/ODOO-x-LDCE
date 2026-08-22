import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiError, TokenPair } from "./types";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifySessionCleared,
  setTokens,
} from "./tokens";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach the access token ─────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// ── Response: transparently refresh on 401, once ─────────────
// A single in-flight refresh is shared by all concurrent 401s so we don't stampede
// the refresh endpoint.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  // Bare axios (no interceptors) to avoid recursion.
  const resp = await axios.post<TokenPair>(`${BASE_URL}/auth/refresh`, {
    refresh_token: refresh,
  });
  const { access_token, refresh_token } = resp.data;
  setTokens(access_token, refresh_token);
  return access_token;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const status = error.response?.status;

    // Only try to refresh once per request, and never for the refresh/login calls.
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/refresh") || url.includes("/auth/login");

    if (status === 401 && original && !original._retried && !isAuthCall && getRefreshToken()) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newAccess = await refreshPromise;
        refreshPromise = null;
        const headers = AxiosHeaders.from(original.headers);
        headers.set("Authorization", `Bearer ${newAccess}`);
        original.headers = headers;
        return api(original);
      } catch {
        refreshPromise = null;
        notifySessionCleared();
      }
    }

    if (status === 401 && !isAuthCall) {
      // No refresh possible — ensure we're logged out.
      clearTokens();
    }

    return Promise.reject(normalizeError(error));
  },
);

// Turn an axios error into a predictable ApiError the UI can rely on.
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: unknown; code?: string }
      | undefined;

    // FastAPI validation errors: detail is an array of {loc, msg, type}.
    if (Array.isArray(data?.detail)) {
      const fields: Record<string, string> = {};
      let first = "";
      for (const item of data!.detail as Array<{ loc?: unknown[]; msg?: string }>) {
        const field = Array.isArray(item.loc) ? String(item.loc[item.loc.length - 1]) : "";
        const msg = item.msg ?? "Invalid value";
        if (field) fields[field] = msg;
        if (!first) first = msg;
      }
      return { detail: first || "Validation failed", code: "validation_error", fields };
    }

    if (typeof data?.detail === "string") {
      return { detail: data.detail, code: data.code };
    }

    if (error.code === "ERR_NETWORK") {
      return { detail: "Cannot reach the server. Is the backend running?", code: "network" };
    }

    return { detail: error.message || "Request failed", code: String(error.response?.status ?? "") };
  }
  return { detail: "Something went wrong", code: "unknown" };
}

// Thin typed helpers so endpoint modules stay terse.
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await api.get<T>(url, config)).data;
}
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.post<T>(url, body, config)).data;
}
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await api.put<T>(url, body, config)).data;
}
export async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await api.delete<T>(url, config)).data;
}
