import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "REQUESTER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  organizationId: string;
  language: string;
  theme: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  // idle: ainda não verificamos a sessão
  status: "idle" | "authenticated" | "unauthenticated";
  setAuth: (user: AuthUser, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setAuth: (user, accessToken) =>
    set({ user, accessToken, status: "authenticated" }),
  setToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
}));

export const isStaff = (role?: string) =>
  role === "AGENT" || role === "ADMIN" || role === "SUPER_ADMIN";
