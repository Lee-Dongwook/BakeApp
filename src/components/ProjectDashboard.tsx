import { FormEvent, useEffect, useState } from "react";
import { FolderOpen, LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useProjectStore } from "../store/useProjectStore";
import { useNavigate } from "@tanstack/react-router";

export const ProjectDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const error = useProjectStore((state) => state.error);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const createProject = useProjectStore((state) => state.createProject);
  const selectProject = useProjectStore((state) => state.selectProject);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const project = await createProject(trimmedName);
      setName("");
      selectProject(project);
      void navigate({ to: "/project/$projectId", params: { projectId: project.id }, search: { mode: "edit" } });
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "프로젝트를 만들지 못했습니다.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="app-shell min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="brand text-2xl">🍞 BakeApp Studio</h1>
            <p className="text-muted mt-1 text-sm">
              {user?.email || "로그인한 사용자"}님의 프로젝트
            </p>
          </div>
          <button type="button" onClick={signOut} className="btn btn-secondary">
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </header>

        <section className="surface mb-8 p-5">
          <h2 className="mb-3 font-semibold">새 프로젝트</h2>
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 재고 관리"
              maxLength={100}
              required
              className="control min-w-0 flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="btn btn-primary text-sm"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "만드는 중…" : "프로젝트 만들기"}
            </button>
          </form>
          {createError && (
            <p className="mt-3 text-sm text-rose-400">{createError}</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">내 프로젝트</h2>
          {isLoading ? (
            <p className="text-muted text-sm">프로젝트를 불러오는 중…</p>
          ) : error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : projects.length === 0 ? (
            <p className="text-muted rounded-lg border border-dashed p-8 text-center text-sm">
              아직 프로젝트가 없습니다. 첫 프로젝트를 만들어 보세요.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    selectProject(project);
                    void navigate({ to: "/project/$projectId", params: { projectId: project.id }, search: { mode: "edit" } });
                  }}
                  className="surface card-interactive flex items-center gap-3 p-5 text-left"
                >
                  <FolderOpen className="h-5 w-5 shrink-0 text-amber-400" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {project.name}
                    </span>
                    <span className="text-muted mt-1 block text-xs">
                      최근 변경{" "}
                      {new Date(project.updatedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
