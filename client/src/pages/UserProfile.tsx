import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Code2,
  Clock,
  GraduationCap,
  Layers,
  Loader2,
  UserPlus,
  UserMinus,
  Sparkles,
  Trophy,
  Users,
  Lock,
  Globe,
} from "lucide-react";
import { api } from "../lib/api";
import { ROLE_META } from "../lib/constants";
import { cn, formatDate } from "../lib/utils";
import { useFollowUser, useUnfollowUser, useJoinRoom } from "../hooks/useQueries";
import type { Course, SkillProgress, Task } from "../types";
import { ProgressRing } from "../components/ui/ProgressRing";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageLoader } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

interface PublicProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  bio: string | null;
  avatarColor: string;
  avatarUrl: string | null;
  createdAt: string;
  skills: SkillProgress[];
  tasksDone: number;
  totalTasks: number;
  totalCodingHours: number;
  courses: Course[];
  tasks: Task[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  coLearningRooms: {
    id: string;
    name: string;
    topic: string;
    visibility: string;
    inviteCode: string;
    streakCount: number;
    maxMembers: number;
    createdAt: string;
    _count: { members: number };
    isMember: boolean;
  }[];
}

export function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const joinRoom = useJoinRoom();

  const [selectedRoom, setSelectedRoom] = useState<{
    id: string;
    name: string;
    visibility: string;
    inviteCode: string;
  } | null>(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");

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

  const profile = data.user;

  const allCourses = profile.courses ?? [];
  const allTasks = profile.tasks ?? [];
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

  const handleRoomClick = (room: { id: string; name: string; visibility: string; inviteCode: string; isMember: boolean }) => {
    if (room.isMember) {
      navigate(`/rooms/${room.id}`);
      return;
    }
    setSelectedRoom(room);
    setJoinPassword("");
    setJoinError("");
  };

  const handleJoinRoom = async () => {
    if (!selectedRoom) return;
    try {
      await joinRoom.mutateAsync({
        inviteCode: selectedRoom.inviteCode,
        password: selectedRoom.visibility === "PRIVATE" ? joinPassword : undefined,
      });
      setSelectedRoom(null);
      navigate(`/rooms/${selectedRoom.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join room";
      setJoinError(msg.includes("password") ? "Incorrect password" : msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Hero card ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-surface">
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
                {ROLE_META[profile.role as keyof typeof ROLE_META]?.label ?? profile.role}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-accent-bright/70">@{profile.username}</p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              {profile.bio?.trim() || (
                <span className="italic text-ink-faint">No bio yet.</span>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink-faint sm:justify-start">
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

            {/* Follow button + followers/following */}
            <div className="mt-5 flex items-center gap-4">
              <Button
                onClick={() =>
                  profile.isFollowing
                    ? unfollowMutation.mutate(profile.username)
                    : followMutation.mutate(profile.username)
                }
                disabled={followMutation.isPending || unfollowMutation.isPending}
                variant={profile.isFollowing ? "outline" : "primary"}
                className="gap-1.5"
              >
                {followMutation.isPending || unfollowMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : profile.isFollowing ? (
                  <UserMinus size={14} />
                ) : (
                  <UserPlus size={14} />
                )}
                {profile.isFollowing ? "Unfollow" : "Follow"}
              </Button>
              <span className="flex items-center gap-4 text-xs text-ink-faint">
                <Link
                  to={`/u/${profile.username}/followers`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all hover:bg-white/5 hover:text-white"
                >
                  <Users size={14} className="text-accent-bright" />
                  <strong className="text-sm text-white">{profile.followersCount}</strong> followers
                </Link>
                <Link
                  to={`/u/${profile.username}/following`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all hover:bg-white/5 hover:text-white"
                >
                  <strong className="text-sm text-white">{profile.followingCount}</strong> following
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Code2} label="Tasks done" value={doneTasks} sub={`${totalTasks} total`} />
        <StatCard icon={Clock} label="Hours coded" value={profile.totalCodingHours} sub="all time" />
        <StatCard icon={GraduationCap} label="Courses" value={completed.length} sub={`of ${allCourses.length}`} />
        <StatCard icon={Sparkles} label="Avg mastery" value={`${avgMastery}%`} sub={`${skills.length} skills`} />
      </div>

      {/* ── Skills cloud ─────────────────────────────────────────── */}
      {skills.length > 0 && (
        <section className="card p-6">
          <header className="mb-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-accent-bright" />
              Skills
            </h3>
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
          <header className="mb-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpen size={16} className="text-accent-bright" />
              Courses
            </h3>
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

      {/* ── Co-Learning Rooms ──────────────────────────────────── */}
      {profile.coLearningRooms && profile.coLearningRooms.length > 0 && (
        <section className="card p-6">
          <header className="mb-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Users size={16} className="text-accent-bright" />
              Co-Learning Rooms
            </h3>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.coLearningRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className="text-left p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-[var(--text-primary)] text-sm truncate">{room.name}</h4>
                  {room.visibility === "PRIVATE" ? (
                    <Lock size={12} className="text-yellow-400 shrink-0" />
                  ) : (
                    <Globe size={12} className="text-green-400 shrink-0" />
                  )}
                  {room.isMember && (
                    <span className="text-[10px] font-medium text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">Joined</span>
                  )}
                </div>
                <p className="text-xs text-[var(--accent)] mb-2">{room.topic}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span>{room._count.members} member{room._count.members !== 1 ? "s" : ""}</span>
                  {room.streakCount > 0 && <span className="text-orange-400">🔥 {room.streakCount}d</span>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Join Room Modal ────────────────────────────────────── */}
      <Modal
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom?.visibility === "PRIVATE" ? "Join Private Room" : "Join Room"}
      >
        {selectedRoom && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-primary)]">
              Join <span className="font-semibold">{selectedRoom.name}</span>?
            </p>
            {selectedRoom.visibility === "PRIVATE" && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                <input
                  type="password"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
                  value={joinPassword}
                  onChange={(e) => { setJoinPassword(e.target.value); setJoinError(""); }}
                  placeholder="Enter room password"
                  autoFocus
                />
                {joinError && <p className="text-xs text-red-400 mt-1">{joinError}</p>}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedRoom(null)} className="text-sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleJoinRoom}
                disabled={joinRoom.isPending || (selectedRoom.visibility === "PRIVATE" && !joinPassword)}
                className="text-sm"
              >
                {joinRoom.isPending ? "Joining..." : "Join"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Empty state ──────────────────────────────────────────── */}
      {allCourses.length === 0 && skills.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No public data yet"
          hint="This user hasn't added courses or skills to their profile."
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
