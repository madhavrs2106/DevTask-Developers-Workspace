import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogIn, Sparkles, Terminal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/ui/LogoMark";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim().toLowerCase().endsWith("@dev.io")) {
      setError("Only @dev.io email addresses can sign in.");
      return;
    }

    setPending(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight px-4">
      {/* Ambient neon glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-radial" />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-neon-gradient opacity-[0.07] blur-3xl"
      />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={48} />
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
              dev<span className="text-gradient-neon">task</span>
            </h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
              <Terminal size={13} className="text-accent" />
              Ship code. Track progress. Level up.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8" noValidate>
          <h2 className="text-lg font-semibold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-faint">Sign in to your developer workspace.</p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-xs leading-relaxed text-rose-300"
            >
              {error}
            </p>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="login-email" className="label-dark">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@dev.io"
                className="input-dark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="label-dark">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input-dark"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neon-gradient px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-glow transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Sign in
          </button>

          {/* Demo account helper */}
          <button
            type="button"
            onClick={() => {
              setEmail("demo@dev.io");
              setPassword("password123");
            }}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 px-3 py-2 font-mono text-[11px] text-ink-faint transition-colors hover:border-accent/40 hover:text-accent-bright"
          >
            <Sparkles size={12} />
            demo@dev.io / password123 — tap to fill
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          New here?{" "}
          <Link to="/signup" className="font-medium text-accent-bright hover:text-accent-soft">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
