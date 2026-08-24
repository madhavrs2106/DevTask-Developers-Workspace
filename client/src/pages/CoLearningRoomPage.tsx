import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  Users,
  MessageSquare,
  Timer,
  Settings,
  Copy,
  Check,
  Flame,
  Lock,
  Globe,
  TrendingUp,
  Sparkles,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useRoom, useLeaveRoom } from "../hooks/useQueries";
import { useAuth } from "../context/AuthContext";
import { SyllabusTab } from "../components/rooms/SyllabusTab";
import { ResourcesTab } from "../components/rooms/ResourcesTab";
import { DiscussionTab } from "../components/rooms/DiscussionTab";
import { FocusTab } from "../components/rooms/FocusTab";
import { MembersTab } from "../components/rooms/MembersTab";
import { RoomSettingsTab } from "../components/rooms/RoomSettingsTab";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

const TABS = [
  { key: "syllabus", label: "Syllabus", icon: BookOpen, description: "Track topics & milestones" },
  { key: "resources", label: "Resources", icon: FileText, description: "Share files & links" },
  { key: "discussions", label: "Discussions", icon: MessageSquare, description: "Ask questions & share" },
  { key: "focus", label: "Focus", icon: Timer, description: "Study together" },
  { key: "members", label: "Members", icon: Users, description: "See who's here" },
  { key: "settings", label: "Settings", icon: Settings, description: "Room settings", adminOnly: true },
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-[var(--text-secondary)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Room not found</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">This room may have been deleted or you don't have access.</p>
          <Button variant="primary" onClick={() => navigate("/rooms")}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = room.members.some(
    (m) => m.user.id === user?.id && m.role === "ADMIN"
  );

  const visibleTabs = TABS.filter((t) => !("adminOnly" in t && t.adminOnly) || isAdmin);

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    await leaveRoom.mutateAsync(room.id);
    navigate("/rooms");
  };

  const completionRate = useMemo(() => {
    if (room.syllabusItems.length === 0) return 0;
    const total = room.syllabusItems.length * room.members.length;
    const completed = room.syllabusItems.reduce((sum, item) => sum + item._count.completions, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [room.syllabusItems, room.members]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, var(--accent) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, var(--accent-2) 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={() => navigate("/rooms")}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Rooms
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left: Room Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] truncate">
                  {room.name}
                </h1>
                {room.visibility === "PRIVATE" ? (
                  <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-medium">
                    <Lock size={12} />
                    Private
                  </span>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-green-400/10 text-green-400 text-xs font-medium">
                    <Globe size={12} />
                    Public
                  </span>
                )}
              </div>
              <p className="text-[var(--accent)] font-medium mb-1">{room.topic}</p>
              {room.description && (
                <p className="text-sm text-[var(--text-secondary)] max-w-xl">{room.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" />
                  Created by {room.creator.username}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {room.members.length} member{room.members.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {room.streakCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-400/10 border border-orange-400/20">
                  <Flame size={18} className="text-orange-400" />
                  <div>
                    <p className="text-lg font-bold text-orange-400">{room.streakCount}</p>
                    <p className="text-[10px] text-orange-400/80 uppercase tracking-wide">day streak</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <code className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] font-mono text-xs text-[var(--text-primary)]">
                  {room.inviteCode}
                </code>
                <button
                  onClick={handleCopyInvite}
                  className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>

              {!isAdmin && (
                <Button variant="ghost" onClick={handleLeave} className="text-sm text-red-400 hover:text-red-300">
                  Leave
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] bg-[var(--bg)]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6 py-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <BookOpen size={14} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{room.syllabusItems.length}</p>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Topics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm shrink-0">
              <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{completionRate}%</p>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm shrink-0">
              <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <FileText size={14} className="text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{room.resources.length}</p>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Resources</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <MessageSquare size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{room.discussions.length}</p>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Discussions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent"
                    )}
                  >
                    <Icon size={18} className={isActive ? "text-[var(--accent)]" : ""} />
                    <div className="text-left">
                      <p>{tab.label}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-normal hidden lg:block">{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "syllabus" && <SyllabusTab room={room} />}
            {activeTab === "resources" && <ResourcesTab room={room} />}
            {activeTab === "discussions" && <DiscussionTab room={room} />}
            {activeTab === "focus" && <FocusTab room={room} />}
            {activeTab === "members" && <MembersTab room={room} isAdmin={isAdmin} />}
            {activeTab === "settings" && isAdmin && <RoomSettingsTab room={room} />}
          </div>
        </div>
      </div>
    </div>
  );
}
