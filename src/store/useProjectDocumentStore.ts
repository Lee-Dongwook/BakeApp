import { create } from "zustand";
import { apiClient } from "../api/client";
import { usePageStore } from "./usePageStore";
import type { Page } from "./usePageStore";
import { useQueryStore } from "./useQueryStore";
import type { ApiQuery } from "./useQueryStore";
import {
  getEditorRevision,
  subscribeToEditorChanges,
} from "./editorChangeTracker";

interface ProjectDocumentState {
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
  error: string | null;
  markDirty: () => void;
  load: (projectId: string) => Promise<void>;
  save: (projectId: string) => Promise<void>;
}

export const useProjectDocumentStore = create<ProjectDocumentState>((set) => ({
  isLoading: false,
  isSaving: false,
  isDirty: false,
  lastSavedAt: null,
  error: null,
  markDirty: () => set({ isDirty: true }),

  load: async (projectId) => {
    set({ isLoading: true, error: null, lastSavedAt: null, isDirty: false });
    usePageStore.getState().resetPages();
    useQueryStore.getState().resetQueries();
    try {
      const savedDocument = await apiClient.get<{
        document?: { pages?: unknown; queries?: unknown };
        updatedAt?: string | null;
      }>(`/api/projects/${projectId}/document`, { auth: true });
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
        isDirty: false,
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
    const { pages } = usePageStore.getState();
    const { queries } = useQueryStore.getState();
    const revisionAtSaveStart = getEditorRevision();
    set({ isSaving: true, error: null });

    try {
      const existing = await apiClient.get<{
        document?: Record<string, unknown>;
      }>(`/api/projects/${projectId}/document`, { auth: true });

      await apiClient.put(
        `/api/projects/${projectId}/document`,
        {
          document: { ...existing.document, pages, queries },
        },
        { auth: true },
      );

      set({
        isSaving: false,
        isDirty: getEditorRevision() !== revisionAtSaveStart,
        lastSavedAt: new Date(),
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
      set({ isSaving: false, error: message });
      throw new Error(message);
    }
  },
}));

subscribeToEditorChanges(() => useProjectDocumentStore.getState().markDirty());
