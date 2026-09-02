import { create } from "zustand";
import { apiClient } from "../api/client";
import { tokenStorage } from "../auth/tokenStorage";

export interface AuthUser {
  id: string;
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  error: null,

  initialize: async () => {
    const accessToken = tokenStorage.get();
    if (!accessToken) {
      set({ isInitializing: false });
      return;
    }

    try {
      const data = await apiClient.get<{ user: AuthUser }>("/api/auth/me", {
        auth: true,
      });
      set({ user: data.user, accessToken, isInitializing: false, error: null });
    } catch {
      tokenStorage.clear();
      set({ user: null, accessToken: null, isInitializing: false });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      const data = await apiClient.post<{
        accessToken?: string;
        user: AuthUser;
      }>("/api/auth/signin", { email, password });
      if (!data.accessToken) {
        const message = "로그인 토큰을 받지 못했습니다.";
        set({ error: message });
        throw new Error(message);
      }

      tokenStorage.set(data.accessToken);
      set({ user: data.user, accessToken: data.accessToken, error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그인에 실패했습니다.";
      set({ error: message });
      throw new Error(message);
    }
  },

  signOut: () => {
    tokenStorage.clear();
    set({ user: null, accessToken: null, error: null });
  },
}));
