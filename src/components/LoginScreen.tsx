import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export const LoginScreen = () => {
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // 오류 문구는 인증 스토어에서 화면에 표시합니다.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🍞</div>
          <h1 className="text-2xl font-bold text-amber-400">BakeApp Studio</h1>
          <p className="mt-2 text-sm text-slate-400">프로젝트를 만들려면 로그인해 주세요.</p>
        </div>

        <label className="mb-4 block text-sm font-medium text-slate-200">
          이메일
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-400"
          />
        </label>
        <label className="mb-5 block text-sm font-medium text-slate-200">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-400"
          />
        </label>

        {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {isSubmitting ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </main>
  );
};
