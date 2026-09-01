import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { usePageStore } from "./usePageStore";
import type { Page } from "./usePageStore";
import { useQueryStore } from "./useQueryStore";
import type { ApiQuery } from "./useQueryStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface ApiError {
  message?: string | string[];
}

interface ProjectDocumentState {
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: string | null;
  load: (projectId: string) => Promise<void>;
  save: (projectId: string) => Promise<void>;
}

const readErrorMessage = async (response: Response) => {
  const data = (await response.json().catch(() => null)) as ApiError | null;
  const message = data?.message;
  return Array.isArray(message) ? message.join(", ") : message || "저장에 실패했습니다.";
};

export const useProjectDocumentStore = create<ProjectDocumentState>((set) => ({
  isLoading: false,
  isSaving: false,
  lastSavedAt: null,
  error: null,

  load: async (projectId) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    set({ isLoading: true, error: null, lastSavedAt: null });
    usePageStore.getState().resetPages();
    useQueryStore.getState().resetQueries();
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/document`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));

      const savedDocument = (await response.json()) as {
        document?: { pages?: unknown; queries?: unknown };
        updatedAt?: string | null;
      };
      const pages = savedDocument.document?.pages;
      const queries = savedDocument.document?.queries;

      if (Array.isArray(pages) && pages.length > 0) {
        usePageStore.getState().replacePages(pages as Page[]);
      }
      if (Array.isArray(queries)) {
        useQueryStore.getState().replaceQueries(queries as ApiQuery[]);
      }

      set({
        isLoading: false,
        lastSavedAt: savedDocument.updatedAt ? new Date(savedDocument.updatedAt) : null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "프로젝트를 불러오지 못했습니다.",
      });
    }
  },

  save: async (projectId) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      const error = "로그인이 필요합니다.";
      set({ error });
      throw new Error(error);
    }

    const { pages } = usePageStore.getState();
    const { queries } = useQueryStore.getState();
    set({ isSaving: true, error: null });

    try {
      const existingResponse = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/document`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!existingResponse.ok) {
        throw new Error(await readErrorMessage(existingResponse));
      }
      const existing = (await existingResponse.json()) as {
        document?: Record<string, unknown>;
      };

      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/document`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          document: { ...existing.document, pages, queries },
        }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));

      set({ isSaving: false, lastSavedAt: new Date(), error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      set({ isSaving: false, error: message });
      throw new Error(message);
    }
  },
}));
