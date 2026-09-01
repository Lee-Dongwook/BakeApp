import { create } from "zustand";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const ACCESS_TOKEN_KEY = "bakeapp.accessToken";

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

interface ApiError {
  message?: string | string[];
}

const readErrorMessage = async (response: Response) => {
  const data = (await response.json().catch(() => null)) as ApiError | null;
  const message = data?.message;
  return Array.isArray(message) ? message.join(", ") : message || "요청에 실패했습니다.";
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  error: null,

  initialize: async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      set({ isInitializing: false });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));

      const data = (await response.json()) as { user: AuthUser };
      set({ user: data.user, accessToken, isInitializing: false, error: null });
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      set({ user: null, accessToken: null, isInitializing: false });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      set({ error: message });
      throw new Error(message);
    }

    const data = (await response.json()) as {
      accessToken?: string;
      user: AuthUser;
    };
    if (!data.accessToken) {
      const message = "로그인 토큰을 받지 못했습니다.";
      set({ error: message });
      throw new Error(message);
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, error: null });
  },

  signOut: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ user: null, accessToken: null, error: null });
  },
}));
