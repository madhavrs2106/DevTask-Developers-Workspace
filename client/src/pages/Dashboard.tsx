import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Clock,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn, formatHours, greeting } from "../lib/utils";
import { ROLE_META } from "../lib/constants";
import { useAnalytics } from "../hooks/useQueries";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/Spinner";
import { ProgressRing } from "../components/ui/ProgressRing";
import { StatCard } from "../components/dashboard/StatCard";
import { WeeklyCodingChart } from "../components/dashboard/WeeklyCodingChart";
import { VelocityChart } from "../components/dashboard/VelocityChart";
import { CompletionDonut } from "../components/dashboard/CompletionDonut";
import { SkillMastery } from "../components/dashboard/SkillMastery";
import { DeadlinesPanel } from "../components/dashboard/DeadlinesPanel";

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return <Spinner className="py-32" label="Crunching your metrics…" />;
  }

  const s = data.stats;
  const hoursSpark = data.weeklyCodingHours.map((d) => d.hours);
  const velocitySpark = data.velocitySeries.map((d) => d.completed);
  const weekTotal = Math.round(hoursSpark.reduce((a, b) => a + b, 0) * 10) / 10;
  const positiveDelta = s.velocityDelta >= 0;

  return (
    <div className="space-y-6">
      {/* ── Greeting + profile ring ─────────────────────────────── */}
      <section className="card relative overflow-hidden p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-radial" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent-bright/80">
              {greeting()}, hacker
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{user?.name}</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-accent-bright">
                {ROLE_META[user?.role ?? "DEVELOPER"].label}
              </span>
              <span>
                {s.activeTasks} active · {formatHours(weekTotal)} this week ·{" "}
                {s.completedCourses}/{s.totalCourses} courses done
              </span>
            </p>
          </div>

          {/* Glowing completion ring */}
          <div className="flex items-center gap-4 self-center sm:self-auto">
            <ProgressRing percent={s.completionRate} size={92} strokeWidth={7}>
              <span className="metric-mono text-lg font-bold text-white">
                {s.completionRate}%
              </span>
            </ProgressRing>
            <div className="text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Task completion
              </p>
              <p className="metric-mono mt-1 text-sm text-slate-200">
                {s.doneTasks}
                <span className="text-ink-faint"> / {s.totalTasks} shipped</span>
              </p>
              <Link
                to="/board"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent-bright hover:text-accent-soft"
              >
                Open board <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metric cards ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total coding hours"
          value={formatHours(s.totalCodingHours)}
          icon={Clock}
          sub={<span className="metric-mono">lifetime total</span>}
          spark={hoursSpark}
        />
        <StatCard
          label="Active tasks"
          value={String(s.activeTasks)}
          icon={Activity}
          sub={
            <span className="metric-mono">
              {s.totalTasks - s.doneTasks > 0 ? "in flight right now" : "all clear 🎉"}
            </span>
          }
          spark={velocitySpark}
        />
        <StatCard
          label="Velocity"
          value={`${s.velocityThisWeek}/wk`}
          icon={Zap}
          sub={
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                positiveDelta ? "bg-teal-400/10 text-teal-300" : "bg-rose-400/10 text-rose-300"
              )}
            >
              {positiveDelta ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(s.velocityDelta)}% vs last week
            </span>
          }
          spark={velocitySpark}
        />
        <StatCard
          label="Completed courses"
          value={`${s.completedCourses}/${s.totalCourses}`}
          icon={GraduationCap}
          sub={
            <span className="metric-mono">
              {data.skillMastery.length} skills tracked
            </span>
          }
        />
      </section>

      {/* ── Charts row 1 ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="card p-5 lg:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Weekly coding hours</h3>
              <p className="text-[11px] text-ink-faint">Last 7 days</p>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              <span className="h-2 w-2 rounded-full bg-neon-gradient shadow-glow-sm" />
              hours logged
            </span>
          </header>
          <WeeklyCodingChart data={data.weeklyCodingHours} />
        </article>

        <article className="card p-5">
          <h3 className="text-sm font-semibold text-white">Task completion rate</h3>
          <p className="text-[11px] text-ink-faint">All-time across every task</p>
          <CompletionDonut rate={s.completionRate} done={s.doneTasks} total={s.totalTasks} />
        </article>
      </section>

      {/* ── Charts row 2 ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="card p-5 lg:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Sprint &amp; learning velocity</h3>
              <p className="text-[11px] text-ink-faint">Tasks shipped per week · trailing 8 weeks</p>
            </div>
            <span className="metric-mono rounded-full border border-teal-400/25 bg-teal-400/10 px-2 py-0.5 text-[11px] font-semibold text-teal-300">
              {s.velocityThisWeek} this wk
            </span>
          </header>
          <VelocityChart data={data.velocitySeries} />
        </article>

        <article className="card p-5">
          <h3 className="text-sm font-semibold text-white">Skill mastery</h3>
          <p className="mb-4 text-[11px] text-ink-faint">Self-rated proficiency per technology</p>
          <SkillMastery skills={data.skillMastery} />
        </article>
      </section>

      {/* ── Deadlines ───────────────────────────────────────────── */}
      <section className="card p-5">
        <header className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-accent-bright" />
            <h3 className="text-sm font-semibold text-white">Upcoming deadlines</h3>
          </div>
          <Link to="/board" className="inline-flex items-center gap-1 text-xs text-accent-bright hover:text-accent-soft">
            View board <ArrowRight size={12} />
          </Link>
        </header>
        <DeadlinesPanel deadlines={data.upcomingDeadlines} />
      </section>
    </div>
  );
}
