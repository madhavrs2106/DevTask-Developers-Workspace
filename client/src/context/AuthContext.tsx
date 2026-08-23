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
import { api, apiErrorMessage, getToken, setToken } from "../lib/api";
import type { AuthResponse, Role, User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getToken()));
  const queryClient = useQueryClient();

  // Restore session on first mount
  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    api
      .get<{ user: User }>("/auth/me")
      .then(({ data }) => {
        if (!cancelled) setUserState(data.user);
      })
      .catch(() => {
        if (!cancelled) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback(
    ({ user: nextUser, token }: AuthResponse) => {
      setToken(token);
      setUserState(nextUser);
      queryClient.clear();
      return nextUser;
    },
    [queryClient]
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      try {
        const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
        return applySession(data);
      } catch (err) {
        throw new Error(apiErrorMessage(err, "Unable to sign in"));
      }
    },
    [applySession]
  );

  const register = useCallback<AuthContextValue["register"]>(
    async (input) => {
      try {
        const { data } = await api.post<AuthResponse>("/auth/register", input);
        return applySession(data);
      } catch (err) {
        throw new Error(apiErrorMessage(err, "Unable to create account"));
      }
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
    queryClient.clear();
  }, [queryClient]);

  const setUser = useCallback((nextUser: User) => setUserState(nextUser), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout, setUser }),
    [user, isLoading, login, register, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
