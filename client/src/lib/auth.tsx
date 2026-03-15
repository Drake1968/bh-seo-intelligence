import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { apiRequest, queryClient } from "./queryClient";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  tenantId: number | null;
}

interface TenantTheme {
  id: number;
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  tenant: TenantTheme | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Use a simple in-memory token store (no localStorage in sandboxed iframe)
let memoryToken: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await fetch(
        `${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setState({
        user: data.user,
        tenant: data.tenant,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      memoryToken = null;
      setState({ user: null, tenant: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (memoryToken) {
      fetchMe(memoryToken);
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    memoryToken = data.token;
    setState({
      user: data.user,
      tenant: null,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });
    // Fetch full data including tenant
    await fetchMe(data.token);
  }, [fetchMe]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { name, email, password });
    const data = await res.json();
    memoryToken = data.token;
    setState({
      user: data.user,
      tenant: null,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });
    await fetchMe(data.token);
  }, [fetchMe]);

  const logout = useCallback(async () => {
    if (state.token) {
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch { /* ignore */ }
    }
    memoryToken = null;
    queryClient.clear();
    setState({ user: null, tenant: null, token: null, isLoading: false, isAuthenticated: false });
  }, [state.token]);

  const setToken = useCallback(async (token: string) => {
    memoryToken = token;
    await fetchMe(token);
  }, [fetchMe]);

  const refreshUser = useCallback(async () => {
    if (memoryToken) {
      await fetchMe(memoryToken);
    }
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Helper to get auth headers for API calls
export function getAuthHeaders(): HeadersInit {
  if (!memoryToken) return {};
  return { Authorization: `Bearer ${memoryToken}` };
}
