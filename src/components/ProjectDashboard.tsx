import { FormEvent, useEffect, useState } from "react";
import { FolderOpen, LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useProjectStore } from "../store/useProjectStore";

export const ProjectDashboard = () => {
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
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "프로젝트를 만들지 못했습니다.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">🍞 BakeApp Studio</h1>
            <p className="mt-1 text-sm text-slate-400">
              {user?.email || "로그인한 사용자"}님의 프로젝트
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </header>

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 font-semibold">새 프로젝트</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 재고 관리"
              maxLength={100}
              required
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "만드는 중…" : "프로젝트 만들기"}
            </button>
          </form>
          {createError && <p className="mt-3 text-sm text-rose-400">{createError}</p>}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">내 프로젝트</h2>
          {isLoading ? (
            <p className="text-sm text-slate-400">프로젝트를 불러오는 중…</p>
          ) : error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : projects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
              아직 프로젝트가 없습니다. 첫 프로젝트를 만들어 보세요.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => selectProject(project)}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-amber-400 hover:bg-slate-800"
                >
                  <FolderOpen className="h-5 w-5 shrink-0 text-amber-400" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{project.name}</span>
                    <span className="mt-1 block text-xs text-slate-400">
                      최근 변경 {new Date(project.updatedAt).toLocaleDateString("ko-KR")}
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
