import { useEffect } from "react";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import App from "./App";
import { LoginScreen } from "./components/LoginScreen";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { useAuthStore } from "./store/useAuthStore";
import { useProjectStore } from "./store/useProjectStore";

export type EditorSearch = {
  pageId?: string;
  mode?: "edit" | "preview";
  codeTarget?: "react" | "rn";
};

function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => void initialize(), [initialize]);
  if (isInitializing)
    return (
      <div className="app-shell flex h-screen items-center justify-center text-secondary">
        세션 확인 중…
      </div>
    );
  return user ? <Outlet /> : <LoginScreen />;
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function IndexRedirect() {
    const navigate = useNavigate();
    useEffect(
      () => void navigate({ to: "/project", replace: true }),
      [navigate],
    );
    return null;
  },
});

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project",
  component: ProjectDashboard,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project/$projectId",
  validateSearch: (search: Record<string, unknown>): EditorSearch => ({
    pageId: typeof search.pageId === "string" ? search.pageId : undefined,
    mode:
      search.mode === "preview" || search.mode === "edit"
        ? search.mode
        : undefined,
    codeTarget:
      search.codeTarget === "react" || search.codeTarget === "rn"
        ? search.codeTarget
        : undefined,
  }),
  component: function ProjectEditorRoute() {
    const { projectId } = editorRoute.useParams();
    editorRoute.useSearch();
    const projects = useProjectStore((state) => state.projects);
    const isLoading = useProjectStore((state) => state.isLoading);
    const loadProjects = useProjectStore((state) => state.loadProjects);
    const selectProject = useProjectStore((state) => state.selectProject);
    const activeProject = useProjectStore((state) => state.activeProject);

    useEffect(() => {
      void loadProjects();
    }, [loadProjects]);
    useEffect(() => {
      const project = projects.find((item) => item.id === projectId);
      if (project && activeProject?.id !== project.id) selectProject(project);
    }, [activeProject?.id, projectId, projects, selectProject]);

    if (isLoading || !projects.length)
      return (
        <div className="app-shell flex h-screen items-center justify-center text-secondary">
          프로젝트를 불러오는 중…
        </div>
      );
    if (!projects.some((project) => project.id === projectId))
      return (
        <div className="app-shell flex h-screen items-center justify-center text-secondary">
          프로젝트를 찾을 수 없습니다.
        </div>
      );

    return <App />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectRoute,
  editorRoute,
]);
export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const AppRouter = () => <RouterProvider router={router} />;
