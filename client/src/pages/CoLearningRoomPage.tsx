import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useRoom, useLeaveRoom } from "../hooks/useQueries";
import { useAuth } from "../context/AuthContext";
import { SyllabusTab } from "../components/rooms/SyllabusTab";
import { DiscussionTab } from "../components/rooms/DiscussionTab";
import { FocusTab } from "../components/rooms/FocusTab";
import { MembersTab } from "../components/rooms/MembersTab";
import { RoomSettingsTab } from "../components/rooms/RoomSettingsTab";
import { Button } from "../components/ui/Button";

const TABS = [
  { key: "syllabus", label: "Syllabus" },
  { key: "discussions", label: "Discussions" },
  { key: "focus", label: "Focus" },
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

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-4 sm:p-5">
        <button onClick={() => navigate("/rooms")} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-2">
          ← Back to Rooms
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{room.name}</h1>
            <p className="text-[var(--accent)] text-sm">{room.topic}</p>
            {room.description && (
              <p className="text-[var(--text-secondary)] text-sm mt-1">{room.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <code className="text-xs bg-[var(--bg)] border border-[var(--border)] px-2 py-1 rounded font-mono">
                {room.inviteCode}
              </code>
              <Button variant="ghost" onClick={handleCopyInvite} className="text-xs px-2 py-1">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            {room.streakCount > 0 && (
              <span className="text-sm text-orange-400">🔥 {room.streakCount} days</span>
            )}
            {!isAdmin && (
              <Button variant="ghost" onClick={handleLeave} className="text-sm text-red-400">
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>

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
      {activeTab === "discussions" && <DiscussionTab room={room} />}
      {activeTab === "focus" && <FocusTab room={room} />}
      {activeTab === "members" && <MembersTab room={room} isAdmin={isAdmin} />}
      {activeTab === "settings" && isAdmin && <RoomSettingsTab room={room} />}
    </div>
  );
}
