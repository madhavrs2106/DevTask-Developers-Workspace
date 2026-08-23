import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { api } from "../lib/api";
import { ROLE_META } from "../lib/constants";
import { cn } from "../lib/utils";
import { ProgressRing } from "../components/ui/ProgressRing";
import { FullPageLoader } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import type { SkillProgress, User } from "../types";

interface PublicProfile extends User {
  skills: SkillProgress[];
  tasksDone: number;
  coursesCompleted: number;
}

export function UserProfile() {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, error } = useQuery<{ user: PublicProfile }>({
    queryKey: ["userProfile", username],
    queryFn: async () => (await api.get<{ user: PublicProfile }>(`/users/${username}`)).data,
    enabled: Boolean(username),
  });

  if (isLoading) return <FullPageLoader />;

  if (error || !data) {
    return (
      <div className="flex justify-center py-20">
        <EmptyState
          icon={Trophy}
          title="User not found"
          hint={`No developer with username "${username}" exists.`}
        />
      </div>
    );
  }

  const { user: profile } = data;
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
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero card */}
      <div className="card relative overflow-hidden">
        <div
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
            <p className="mt-1 font-mono text-sm text-accent-bright/70">@{profile.username}</p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              {profile.bio?.trim() || (
                <span className="italic text-ink-faint">No bio yet.</span>
              )}
            </p>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
              {[
                { label: "Tasks done", value: profile.tasksDone },
                { label: "Courses", value: profile.coursesCompleted },
                { label: "Skills", value: skills.length },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <span className="block font-mono text-lg font-bold text-white">{s.value}</span>
                  <span className="text-[11px] text-ink-faint">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-3 text-sm font-semibold text-white">Skills</h2>
          <div className="space-y-2.5">
            {skills.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-slate-300">{s.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-neon-gradient transition-all"
                    style={{ width: `${s.level}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs text-ink-faint">{s.level}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
