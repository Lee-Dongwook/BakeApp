import { create } from "zustand";
import { apiClient } from "../api/client";

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  selectProject: (project: Project) => void;
  closeProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await apiClient.get<Project[]>("/api/projects", {
        auth: true,
      });
      set({ projects, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "프로젝트를 불러오지 못했습니다.",
      });
    }
  },

  createProject: async (name) => {
    const project = await apiClient.post<Project>(
      "/api/projects",
      { name },
      { auth: true },
    );
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  selectProject: (project) => set({ activeProject: project }),
  closeProject: () => set({ activeProject: null }),
}));
