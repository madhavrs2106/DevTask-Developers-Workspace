import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Code2,
  Clock,
  GraduationCap,
  Layers,
  PencilLine,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAnalytics, useCourses, useMe, useTasks } from "../hooks/useQueries";
import { ROLE_META } from "../lib/constants";
import { cn, formatDate } from "../lib/utils";
import type { Course, SkillProgress, Task } from "../types";
import { ProgressRing } from "../components/ui/ProgressRing";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageLoader } from "../components/ui/Spinner";

export function Profile() {
  const { user } = useAuth();
  const me = useMe();
  const courses = useCourses();
  const tasks = useTasks();
  const analytics = useAnalytics();

  if (me.isLoading || !user) return <FullPageLoader />;
  const profile = me.data ?? user;

  const allCourses = courses.data ?? [];
  const allTasks = tasks.data ?? [];
  const stats = analytics.data?.stats;

  const learning = allCourses.filter((c) => c.status === "IN_PROGRESS");
  const completed = allCourses.filter((c) => c.status === "COMPLETED");
  const skills = [...(profile.skills ?? [])].sort((a, b) => b.level - a.level);
  const avgMastery = skills.length
    ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
    : 0;
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const totalTasks = allTasks.length;

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Hero card ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-surface">
        {/* Ambient gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 20% 0%, ${profile.avatarColor}33 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgb(var(--accent-2-rgb) / 0.25) 0%, transparent 50%)`,
          }}
        />

        <div className="relative flex flex-col items-center gap-6 px-6 pb-8 pt-10 sm:flex-row sm:items-start sm:px-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <ProgressRing percent={avgMastery} size={128} strokeWidth={5}>
              <span
                aria-hidden={!profile.avatarUrl}
                className="flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full font-mono text-2xl font-bold text-slate-950"
                style={{
                  background: `linear-gradient(135deg, ${profile.avatarColor}, rgb(var(--accent-2-rgb)))`,
                  boxShadow: `0 0 32px ${profile.avatarColor}44`,
                }}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
            </ProgressRing>
            <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-bright">
              {avgMastery}%
            </span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:justify-start">
              <h1 className="text-2xl font-bold tracking-tight text-white">{profile.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-bright">
                <Trophy size={11} />
                {ROLE_META[profile.role].label}
              </span>
            </div>

            <p className="mt-1 font-mono text-xs text-ink-faint">{profile.email}</p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              {profile.bio?.trim() || (
                <span className="italic text-ink-faint">No bio yet — tell the world what you ship.</span>
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink-faint sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="text-accent-bright" />
                Joined {formatDate(profile.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers size={13} className="text-accent-bright" />
                {totalTasks} tasks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={13} className="text-accent-bright" />
                {completed.length} courses completed
              </span>
            </div>

            <Link
              to="/settings"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-surface-raised px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:border-accent/50 hover:text-accent-bright hover:shadow-glow-sm"
            >
              <PencilLine size={13} />
              Edit profile
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Code2}
          label="Tasks done"
          value={doneTasks}
          sub={`${totalTasks} total`}
        />
        <StatCard
          icon={Clock}
          label="Hours coded"
          value={stats?.totalCodingHours ?? 0}
          sub="all time"
        />
        <StatCard
          icon={GraduationCap}
          label="Courses"
          value={completed.length}
          sub={`of ${allCourses.length}`}
        />
        <StatCard
          icon={Sparkles}
          label="Avg mastery"
          value={`${avgMastery}%`}
          sub={`${skills.length} skills`}
        />
      </div>

      {/* ── Skills cloud ─────────────────────────────────────────── */}
      {skills.length > 0 && (
        <section className="card p-6">
          <header className="mb-5 flex items-center justify-between">
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
          <div className="flex flex-wrap gap-2.5">
            {skills.map((s) => (
              <SkillChip key={s.name} skill={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Courses ──────────────────────────────────────────────── */}
      {allCourses.length > 0 && (
        <section className="card p-6">
          <header className="mb-5 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpen size={16} className="text-accent-bright" />
              Courses
            </h3>
            <Link
              to="/courses"
              className="text-[11px] text-ink-faint transition-colors hover:text-accent-bright"
            >
              view all →
            </Link>
          </header>

          {learning.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                In Progress
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {learning.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                Completed
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((c) => (
                  <CourseCard key={c.id} course={c} done />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {allCourses.length === 0 && skills.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Your profile is just getting started"
          hint="Add courses and skills in the app to see them here."
        />
      )}
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Code2;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="card group px-4 py-3 transition-all duration-300 hover:border-accent/30 hover:shadow-glow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-bright transition-all duration-300 group-hover:shadow-glow-sm">
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="metric-mono text-lg font-bold leading-tight text-white">{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">{sub}</p>
    </div>
  );
}

function SkillChip({ skill }: { skill: SkillProgress }) {
  const tier =
    skill.level >= 80 ? "text-teal-300 border-teal-400/30 bg-teal-400/10" :
    skill.level >= 50 ? "text-accent-bright border-accent/25 bg-accent/10" :
    "text-slate-300 border-slate-700 bg-surface-raised";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        tier
      )}
    >
      <span>{skill.name}</span>
      <span className="metric-mono text-[10px] opacity-70">{skill.level}%</span>
    </span>
  );
}

function CourseCard({ course: c, done = false }: { course: Course; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-surface-raised px-4 py-3 transition-all hover:border-slate-700">
      <ProgressRing
        percent={c.progress}
        size={40}
        strokeWidth={3}
        from={done ? "#14B8A6" : undefined}
        to={done ? "#0D9488" : undefined}
      >
        <span className="metric-mono text-[9px] font-bold text-white">{c.progress}%</span>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{c.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-faint">
          {[c.provider, c.category].filter(Boolean).join(" · ") || "Self-paced"}
          {" · "}
          {c.lessonsDone}/{c.totalLessons}
        </p>
      </div>
      {done && <CheckCircle2 size={16} className="shrink-0 text-teal-400" />}
    </div>
  );
}
