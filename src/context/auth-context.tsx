"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { User, LoginBody, RegisterBody } from "@/lib/types";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  setTokens,
  clearTokens,
  getAccessToken,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (body: LoginBody) => Promise<{ ok: boolean; error?: string }>;
  register: (body: RegisterBody) => Promise<{ ok: boolean; error?: string; email?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // On mount, try to fetch current user if we have a token
  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getMe();
      if (res.success) {
        setUser(res.data);
      } else {
        setUser(null);
        clearTokens();
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Sync OAuth tokens (Google/Facebook) from NextAuth session to localStorage
  useEffect(() => {
    const sessionToken = (session as any)?.accessToken as string | undefined;
    const sessionRefresh = (session as any)?.refreshToken as string | undefined;
    if (sessionToken && !getAccessToken()) {
      setTokens(sessionToken, sessionRefresh ?? "");
      refreshUser();
    }
  }, [session, refreshUser]);

  const login = useCallback(
    async (body: LoginBody): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await apiLogin(body);
        if (res.success) {
          setTokens(res.data.access_token, res.data.refresh_token);
          setUser(res.data.user);
          return { ok: true };
        }
        return { ok: false, error: res.error.message };
      } catch {
        return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
      }
    },
    []
  );

  const register = useCallback(
    async (body: RegisterBody): Promise<{ ok: boolean; error?: string; email?: string }> => {
      try {
        const res = await apiRegister(body);
        if (res.success) {
          // Register now creates an unverified account and sends OTP — no tokens yet
          return { ok: true, email: res.data.email };
        }
        return { ok: false, error: res.error.message };
      } catch {
        return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // still clear local tokens
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
