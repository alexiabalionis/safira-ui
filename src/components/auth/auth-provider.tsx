"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCurrentUser,
  logout as logoutRequest,
} from "@/services/integrations/auth.service";
import { ApiRequestError } from "@/services/integrations/api-base";
import type { AuthRole, AuthUser } from "@/types/auth.types";

export type Role = AuthRole;
type User = AuthUser;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
  setSessionUser: (value: User | null) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isHandlingAuthErrorRef = useRef(false);

  const clearSessionAndRedirect = useCallback(async () => {
    if (isHandlingAuthErrorRef.current) return;
    isHandlingAuthErrorRef.current = true;

    try {
      await logoutRequest();
    } catch {
      // Best effort: the middleware also clears invalid cookies on redirect.
    } finally {
      setUser(null);
      setIsLoading(false);

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.replace("/login");
      }

      isHandlingAuthErrorRef.current = false;
    }
  }, []);

  const isAuthError = useCallback((error: unknown) => {
    if (!(error instanceof ApiRequestError)) return false;

    if (error.status === 401) return true;
    if (error.status === 403 && error.message.toLowerCase().includes("token")) {
      return true;
    }
    if (
      error.status === 403 &&
      error.message.toLowerCase().includes("troca de senha")
    ) {
      return false;
    }

    return false;
  }, []);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch (error) {
      if (isAuthError(error)) {
        await clearSessionAndRedirect();
        return;
      }

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionAndRedirect, isAuthError]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function handleAuthError() {
      void clearSessionAndRedirect();
    }

    window.addEventListener("safira:auth-error", handleAuthError);
    return () => {
      window.removeEventListener("safira:auth-error", handleAuthError);
    };
  }, [clearSessionAndRedirect]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      hasRole: (roles) => {
        if (!user) return false;
        return roles.includes(user.role);
      },
      setSessionUser: setUser,
      refreshSession,
      logout,
    }),
    [isLoading, logout, refreshSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
