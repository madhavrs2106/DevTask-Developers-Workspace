import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Code2, GraduationCap, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/ui/LogoMark";
import { cn } from "../lib/utils";
import type { Role } from "../types";

const ROLE_OPTIONS: {
  id: Role;
  label: string;
  blurb: string;
  icon: typeof Code2;
}[] = [
  {
    id: "DEVELOPER",
    label: "Developer",
    blurb: "Track projects, sprints & shipping velocity",
    icon: Code2,
  },
  {
    id: "LEARNER",
    label: "Learner",
    blurb: "Follow roadmaps, courses & skill mastery",
    icon: GraduationCap,
  },
];

export function Signup() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim().toLowerCase().endsWith("@dev.io")) {
      setError("Registration is limited to @dev.io company email addresses.");
      return;
    }

    setPending(true);
    try {
      await register({ name, email, password, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight px-4 py-10">
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
              Join dev<span className="text-gradient-neon">task</span>
            </h1>
            <p className="mt-1 text-xs text-ink-muted">Your code journey, quantified.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8" noValidate>
          <h2 className="text-lg font-semibold text-white">Create your account</h2>
          <p className="mt-1 text-sm text-ink-faint">Free forever. Two minutes to first insight.</p>

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
              <label htmlFor="signup-name" className="label-dark">
                Name
              </label>
              <input
                id="signup-name"
                required
                minLength={2}
                autoComplete="name"
                placeholder="Ada Lovelace"
                className="input-dark"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="label-dark">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@dev.io"
                className="input-dark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Must be a company address ending in <span className="text-accent-bright">@dev.io</span>
              </p>
            </div>
            <div>
              <label htmlFor="signup-password" className="label-dark">
                Password <span className="normal-case text-ink-faint">(min. 8 characters)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="input-dark"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Role picker */}
            <div>
              <span className="label-dark">I am a…</span>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(({ id, label, blurb, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      role === id
                        ? "border-accent/60 bg-accent/[.07] shadow-glow-sm"
                        : "border-slate-800 bg-surface-raised hover:border-slate-600"
                    )}
                  >
                    <Icon
                      size={17}
                      className={role === id ? "text-accent-bright" : "text-ink-faint"}
                    />
                    <span
                      className={cn(
                        "mt-1.5 block text-sm font-medium",
                        role === id ? "text-white" : "text-slate-300"
                      )}
                    >
                      {label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint">
                      {blurb}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neon-gradient px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-glow transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-bright hover:text-accent-soft">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
