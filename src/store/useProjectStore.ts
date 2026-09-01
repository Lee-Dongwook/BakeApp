import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  message?: string | string[];
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

const getAuthorizationHeader = () => {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return { Authorization: `Bearer ${accessToken}` };
};

const readErrorMessage = async (response: Response) => {
  const data = (await response.json().catch(() => null)) as ApiError | null;
  const message = data?.message;
  return Array.isArray(message) ? message.join(", ") : message || "요청에 실패했습니다.";
};

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: getAuthorizationHeader(),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));

      const projects = (await response.json()) as Project[];
      set({ projects, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "프로젝트를 불러오지 못했습니다.",
      });
    }
  },

  createProject: async (name) => {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthorizationHeader(),
      },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response));

    const project = (await response.json()) as Project;
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  selectProject: (project) => set({ activeProject: project }),
  closeProject: () => set({ activeProject: null }),
}));
