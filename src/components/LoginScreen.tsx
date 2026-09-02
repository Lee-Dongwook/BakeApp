import { FormEvent, useState } from "react";
import { LogIn, UserPlus, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export const LoginScreen = () => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleTabChange = (nextTab: "signin" | "signup") => {
    setTab(nextTab);
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (tab === "signup" && password !== confirmPassword) {
      setLocalError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setLocalError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch {
      // Handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-6 bg-[var(--surface-canvas)]">
      <div className="surface w-full max-w-md p-8 border border-[var(--border-subtle)] shadow-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-3xl mb-3 shadow-inner">
            🍞
          </div>
          <h1 className="brand text-2xl font-bold tracking-tight">BakeApp Studio</h1>
          <p className="text-muted mt-2 text-xs">
            PostgreSQL 기반 내부 업무 도구 노코드 시각 빌더
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="segmented w-full mb-6 grid grid-cols-2 p-1">
          <button
            type="button"
            onClick={() => handleTabChange("signin")}
            className={`segment flex items-center justify-center gap-1.5 py-2 text-xs font-semibold ${
              tab === "signin" ? "is-selected" : ""
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>로그인</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("signup")}
            className={`segment flex items-center justify-center gap-1.5 py-2 text-xs font-semibold ${
              tab === "signup" ? "is-selected" : ""
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>회원가입</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-secondary block text-xs font-semibold mb-1.5">
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              className="control text-sm"
            />
          </div>

          <div>
            <label className="text-secondary block text-xs font-semibold mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              required
              className="control text-sm"
            />
          </div>

          {tab === "signup" && (
            <div>
              <label className="text-secondary block text-xs font-semibold mb-1.5">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="control text-sm"
              />
            </div>
          )}

          {displayError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-2.5 text-xs font-bold mt-2 shadow"
          >
            {isSubmitting ? (
              <span>처리 중…</span>
            ) : tab === "signin" ? (
              <span className="flex items-center justify-center gap-1.5">
                <LogIn className="h-4 w-4" /> 로그인
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4" /> 계정 만들기 & 시작
              </span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
};
