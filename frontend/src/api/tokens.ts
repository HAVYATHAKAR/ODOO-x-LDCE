// Token persistence. Tokens live in localStorage so a page refresh keeps the
// session. A tiny listener lets AuthContext react when the session is force-cleared
// (e.g. refresh failed) without a hard circular import on the client.

const ACCESS_KEY = "gt_access_token";
const REFRESH_KEY = "gt_refresh_token";

type Listener = () => void;
const sessionClearedListeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function setAccessToken(access: string): void {
  localStorage.setItem(ACCESS_KEY, access);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Called by the client when the session becomes invalid and can't be refreshed. */
export function notifySessionCleared(): void {
  clearTokens();
  sessionClearedListeners.forEach((fn) => fn());
}

export function onSessionCleared(fn: Listener): () => void {
  sessionClearedListeners.add(fn);
  return () => sessionClearedListeners.delete(fn);
}
