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
    <main className="app-shell flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="surface w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🍞</div>
          <h1 className="brand text-2xl">BakeApp Studio</h1>
          <p className="text-muted mt-2 text-sm">
            프로젝트를 만들려면 로그인해 주세요.
          </p>
        </div>

        <label className="text-secondary mb-4 block text-sm font-medium">
          이메일
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="control mt-1.5"
          />
        </label>
        <label className="text-secondary mb-5 block text-sm font-medium">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="control mt-1.5"
          />
        </label>

        {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full py-2.5"
        >
          <LogIn className="h-4 w-4" />
          {isSubmitting ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </main>
  );
};
