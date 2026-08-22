import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/api/endpoints/auth";
import {
  clearTokens,
  getAccessToken,
  onSessionCleared,
  setTokens,
} from "@/api/tokens";
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from "@/api/types";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (body: LoginRequest) => Promise<UserProfile>;
  register: (body: RegisterRequest) => Promise<UserProfile>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Hydrate the session on mount if we have a stored token.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // React to a forced logout (refresh failed) triggered inside the API client.
  useEffect(() => {
    return onSessionCleared(() => {
      setUser(null);
      queryClient.clear();
    });
  }, [queryClient]);

  const applyAuth = useCallback((resp: AuthResponse): UserProfile => {
    setTokens(resp.tokens.access_token, resp.tokens.refresh_token);
    setUser(resp.user);
    return resp.user;
  }, []);

  const login = useCallback(
    async (body: LoginRequest) => applyAuth(await authApi.login(body)),
    [applyAuth],
  );

  const register = useCallback(
    async (body: RegisterRequest) => applyAuth(await authApi.register(body)),
    [applyAuth],
  );

  const logout = useCallback(() => {
    // Fire-and-forget server call; client state is what matters for stateless JWT.
    authApi.logout().catch(() => undefined);
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: !!user?.is_admin,
      login,
      register,
      logout,
      setUser,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
