import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  PencilLine,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCourses, useMe } from "../hooks/useQueries";
import { ROLE_META } from "../lib/constants";
import { formatDate } from "../lib/utils";
import type { Course, SkillProgress } from "../types";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageLoader, Spinner } from "../components/ui/Spinner";

export function Profile() {
  const { user } = useAuth();
  const me = useMe();
  const courses = useCourses();

  if (me.isLoading || !user) return <FullPageLoader />;
  const profile = me.data ?? user;

  const all = courses.data ?? [];
  const learning = all.filter((c) => c.status === "IN_PROGRESS");
  const completed = all.filter((c) => c.status === "COMPLETED");
  const skills = [...(profile.skills ?? [])].sort((a, b) => b.level - a.level);
  const avgMastery = skills.length
    ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
    : 0;

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">Your developer identity at a glance.</p>
      </div>

      {/* Identity card */}
      <section className="card card-interactive p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span
            aria-hidden={!profile.avatarUrl}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full font-mono text-xl font-bold text-slate-950 ring-2 ring-accent/40"
            style={{
              background: `linear-gradient(135deg, ${profile.avatarColor}, rgb(var(--accent-2-rgb)))`,
              boxShadow: `0 0 24px ${profile.avatarColor}55`,
            }}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-bright">
                <BadgeCheck size={12} />
                {ROLE_META[profile.role].label}
              </span>
            </div>

            <p className="mt-0.5 font-mono text-xs text-ink-faint">{profile.email}</p>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              {profile.bio?.trim() || (
                <span className="text-ink-faint italic">No bio yet — tell the world what you ship.</span>
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="text-accent-bright" />
                Joined {formatDate(profile.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-accent-bright" />
                Avg skill mastery <b className="metric-mono ml-0.5 text-accent-bright">{avgMastery}%</b>
              </span>
              <Link
                to="/settings"
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-accent/50 hover:text-accent-bright"
              >
                <PencilLine size={13} />
                Edit profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Courses + Skills */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Courses */}
        <section className="card p-5">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <GraduationCap size={16} className="text-accent-bright" />
              Courses
            </h3>
            <span className="metric-mono text-[11px] uppercase tracking-wider text-ink-faint">
              {learning.length} learning · {completed.length} completed
            </span>
          </header>

          {courses.isLoading ? (
            <Spinner label="Loading courses…" />
          ) : all.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              hint="Add courses you're learning to track lessons and progress here."
            />
          ) : (
            <div className="space-y-5">
              {learning.length > 0 && (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    Learning
                  </p>
                  <ul className="space-y-4">
                    {learning.map((c) => (
                      <CourseRow key={c.id} course={c} />
                    ))}
                  </ul>
                </>
              )}

              {completed.length > 0 && (
                <>
                  <p className="pt-1 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    Completed
                  </p>
                  <ul className="space-y-4">
                    {completed.map((c) => (
                      <CourseRow key={c.id} course={c} done />
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>

        {/* Skills */}
        <section className="card p-5">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-accent-bright" />
              Skills
            </h3>
            <Link
              to="/settings"
              className="text-[11px] text-ink-faint transition-colors hover:text-accent-bright"
            >
              manage →
            </Link>
          </header>

          {skills.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No skills tracked yet"
              hint="Add your stack in Settings to visualise mastery over time."
            />
          ) : (
            <ul className="space-y-4">
              {skills.map((s) => (
                <SkillRow key={s.name} skill={s} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────── */

function CourseRow({ course: c, done = false }: { course: Course; done?: boolean }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-medium text-slate-200">{c.title}</p>
        <span className={`metric-mono shrink-0 text-xs font-semibold ${done ? "text-teal-300" : "text-accent-bright"}`}>
          {done ? <CheckCircle2 size={14} className="inline text-teal-400" /> : null}
          {" "}
          {c.progress}%
        </span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-ink-faint">
        {[c.provider, c.category].filter(Boolean).join(" · ") || "Self-paced"}
        {" — "}
        {c.lessonsDone}/{c.totalLessons} lessons
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? "bg-teal-400 shadow-glow-sm" : "bg-neon-gradient shadow-glow-sm"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, c.progress))}%` }}
        />
      </div>
    </li>
  );
}

function SkillRow({ skill }: { skill: SkillProgress }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-medium text-slate-200">{skill.name}</p>
        <span className="metric-mono text-xs font-semibold text-accent-bright">{skill.level}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-neon-gradient shadow-glow-sm transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, skill.level))}%` }}
        />
      </div>
    </li>
  );
}
