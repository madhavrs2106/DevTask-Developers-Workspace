import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useRoom, useLeaveRoom } from "../hooks/useQueries";
import { useAuth } from "../context/AuthContext";
import { SyllabusTab } from "../components/rooms/SyllabusTab";
import { DiscussionTab } from "../components/rooms/DiscussionTab";
import { LeaderboardTab } from "../components/rooms/LeaderboardTab";
import ProblemsTab from "../components/rooms/ProblemsTab";
import { MembersTab } from "../components/rooms/MembersTab";
import { RoomSettingsTab } from "../components/rooms/RoomSettingsTab";
import { QuizTab } from "../components/rooms/QuizTab";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";
import { ArrowLeft, Copy, Check, Users, Flame, Lock, Globe } from "lucide-react";
import { cn } from "../lib/utils";

const TABS = [
  { key: "syllabus", label: "Syllabus" },
  { key: "quizzes", label: "Quizzes" },
  { key: "discussions", label: "Discussions" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "problems", label: "Problems" },
  { key: "members", label: "Members" },
  { key: "settings", label: "Settings", adminOnly: true },
] as const;

export default function CoLearningRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: room, isLoading } = useRoom(id!);
  const { user } = useAuth();
  const leaveRoom = useLeaveRoom();

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("syllabus");
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--text-secondary)]">Room not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/rooms")}>
          Back to Rooms
        </Button>
      </div>
    );
  }

  const isAdmin = room.members.some(
    (m) => m.user.id === user?.id && m.role === "ADMIN"
  );

  const visibleTabs = TABS.filter((t) => !("adminOnly" in t && t.adminOnly) || isAdmin);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    await leaveRoom.mutateAsync(room.id);
    navigate("/rooms");
  };

  const handleTabClick = (key: string) => {
    setActiveTab(key as typeof activeTab);
  };

  const completedTopics = room.syllabusItems.filter((item) =>
    item.completions?.some((c) => c.userId === user?.id)
  ).length;
  const totalTopics = room.syllabusItems.length;
  const topicProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      {activeTab === "syllabus" && (
      <section className="card relative overflow-hidden p-6 mb-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-radial" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <button
              onClick={() => navigate("/rooms")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-accent-bright transition-colors mb-3"
            >
              <ArrowLeft size={14} />
              Back to Rooms
            </button>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{room.name}</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-accent-bright/80">
              {room.topic}
            </p>
            {room.description && (
              <p className="mt-2 text-sm text-ink-muted max-w-lg">{room.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide",
                room.visibility === "PUBLIC"
                  ? "border-teal-400/25 bg-teal-400/10 text-teal-300"
                  : "border-amber-400/25 bg-amber-400/10 text-amber-300"
              )}>
                {room.visibility === "PUBLIC" ? <Globe size={11} /> : <Lock size={11} />}
                {room.visibility}
              </span>
              <div className="flex items-center gap-1.5">
                <code className="text-[11px] bg-surface-raised border border-slate-700 px-2 py-0.5 rounded font-mono text-slate-300">
                  {room.inviteCode}
                </code>
                <button
                  onClick={handleCopyInvite}
                  className="p-1 rounded-md text-ink-faint hover:text-accent-bright hover:bg-white/5 transition-colors"
                  title="Copy invite code"
                >
                  {copied ? <Check size={13} className="text-teal-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Stats ring */}
          <div className="flex items-center gap-5 self-center sm:self-auto">
            <div className="text-center">
              <ProgressRing percent={topicProgress} size={80} strokeWidth={6}>
                <span className="metric-mono text-base font-bold text-white">{topicProgress}%</span>
              </ProgressRing>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Syllabus
              </p>
              <p className="metric-mono text-[11px] text-slate-400">
                {completedTopics}/{totalTopics}
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-surface-raised px-4 py-2.5">
                <Users size={16} className="text-accent-bright" />
                <div>
                  <p className="metric-mono text-sm font-bold text-white">{room.members.length}</p>
                  <p className="text-[10px] text-ink-faint">/ {room.maxMembers}</p>
                </div>
              </div>
              {room.streakCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2">
                  <Flame size={14} className="text-amber-400" />
                  <span className="metric-mono text-sm font-bold text-amber-300">{room.streakCount}d</span>
                </div>
              )}
              {!isAdmin && (
                <Button variant="ghost" onClick={handleLeave} className="text-xs text-red-400 hover:bg-red-400/10">
                  Leave Room
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "syllabus" && <SyllabusTab room={room} />}
      {activeTab === "quizzes" && <QuizTab room={room} isAdmin={isAdmin} />}
      {activeTab === "discussions" && <DiscussionTab room={room} />}
      {activeTab === "leaderboard" && <LeaderboardTab room={room} />}
      {activeTab === "problems" && <ProblemsTab roomId={room.id} isAdmin={isAdmin} />}
      {activeTab === "members" && <MembersTab room={room} isAdmin={isAdmin} />}
      {activeTab === "settings" && isAdmin && <RoomSettingsTab room={room} />}
    </div>
  );
}
