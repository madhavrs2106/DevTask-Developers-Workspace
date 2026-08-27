import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useMyRooms,
  useCreateRoom,
  useJoinRoom,
  useRoomPreview,
} from "../hooks/useQueries";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Users, Lock, Globe, Flame, Crown, Eye, BookOpen } from "lucide-react";
import { AVATAR_COLORS } from "../lib/constants";
import { formatDate } from "../lib/utils";

export default function CoLearningRoomsPage() {
  const { data: rooms, isLoading } = useMyRooms();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [exploreRoomId, setExploreRoomId] = useState<string | null>(null);
  const { data: previewRoom, isLoading: previewLoading } = useRoomPreview(exploreRoomId ?? "");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [accentColor, setAccentColor] = useState(AVATAR_COLORS[0]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoom.mutateAsync({
      name,
      topic,
      description: description || undefined,
      visibility,
      password: visibility === "PRIVATE" ? password : undefined,
    });
    setName("");
    setTopic("");
    setDescription("");
    setVisibility("PUBLIC");
    setPassword("");
    setAccentColor(AVATAR_COLORS[0]);
    setShowCreate(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinRoom.mutateAsync({
      inviteCode: inviteCode.toUpperCase(),
      password: joinPassword || undefined,
    });
    setInviteCode("");
    setJoinPassword("");
    setShowJoin(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Co-Learning Rooms</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Study together, track progress, and stay accountable as a group.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowJoin(true)}>
            Join Room
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            Create Room
          </Button>
        </div>
      </div>

      {rooms && rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="card card-interactive group relative overflow-hidden p-5"
            >
              {/* Color top bar */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)`,
                  boxShadow: `0 0 14px ${accentColor}66`,
                }}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white truncate">{room.name}</h3>
                    {room.visibility === "PRIVATE" ? (
                      <Lock size={14} className="text-yellow-400 shrink-0" />
                    ) : (
                      <Globe size={14} className="text-green-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--accent)] mt-0.5">{room.topic}</p>
                </div>
                {room.role === "ADMIN" && (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                    <Crown size={10} /> Admin
                  </span>
                )}
              </div>

              {room.description && (
                <p className="mt-2 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-ink-muted">
                  {room.description}
                </p>
              )}

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-xs text-ink-faint">
                <span className="inline-flex items-center gap-1">
                  <Users size={12} />
                  {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
                </span>
                {room.streakCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-orange-400">
                    <Flame size={12} /> {room.streakCount} day streak
                  </span>
                )}
              </div>

              {/* Footer */}
              <footer className="mt-4 flex items-center justify-between border-t border-slate-800/70 pt-3">
                <span className="font-mono text-[11px] text-ink-faint">
                  created {formatDate(room.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExploreRoomId(room.id);
                      setShowExplore(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye size={12} />
                    Explore
                  </button>
                  <span className="text-[var(--accent)] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </div>
              </footer>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No rooms yet"
          hint="Create a co-learning room or join one with an invite code."
        />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Room Name</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DSA Study Group"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Topic</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description (optional)</label>
            <textarea
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] h-20 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you study?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Accent Color</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.slice(0, 8).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`w-7 h-7 rounded-full transition-all ${accentColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--bg)] scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Visibility</label>
            <select
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
            >
              <option value="PUBLIC">Public — anyone can join</option>
              <option value="PRIVATE">Private — requires password</option>
            </select>
          </div>
          {visibility === "PRIVATE" && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
              <input
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                required
                minLength={4}
              />
            </div>
          )}
          <Button variant="primary" type="submit" disabled={createRoom.isPending} className="w-full">
            {createRoom.isPending ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join Room">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Invite Code</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono text-center text-lg tracking-widest focus:outline-none focus:border-[var(--accent)]"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="ABCD1234"
              required
              maxLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password (if private)</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Leave blank if public"
            />
          </div>
          <Button variant="primary" type="submit" disabled={joinRoom.isPending} className="w-full">
            {joinRoom.isPending ? "Joining..." : "Join Room"}
          </Button>
        </form>
      </Modal>

      {/* Explore Modal */}
      <Modal open={showExplore} onClose={() => { setShowExplore(false); setExploreRoomId(null); }} title="Room Preview">
        {previewLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : previewRoom ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{previewRoom.name}</h3>
                {previewRoom.visibility === "PRIVATE" ? (
                  <Lock size={14} className="text-yellow-400" />
                ) : (
                  <Globe size={14} className="text-green-400" />
                )}
              </div>
              <p className="text-sm text-[var(--accent)]">{previewRoom.topic}</p>
              {previewRoom.description && (
                <p className="mt-2 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{previewRoom.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <Users size={12} />
                {previewRoom.memberCount} member{previewRoom.memberCount !== 1 ? "s" : ""}
              </span>
              <span>Max {previewRoom.maxMembers}</span>
            </div>

            {previewRoom.syllabusItems && previewRoom.syllabusItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                  <BookOpen size={14} />
                  Syllabus ({previewRoom.syllabusItems.length} topics)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewRoom.syllabusItems.map((item: { id: string; title: string; description: string | null; order: number }) => (
                    <div key={item.id} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded">
                          {item.order}
                        </span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!previewRoom.syllabusItems || previewRoom.syllabusItems.length === 0) && (
              <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                No syllabus topics yet.
              </p>
            )}

            <Button variant="primary" className="w-full" onClick={() => {
              setShowExplore(false);
              setExploreRoomId(null);
              if (previewRoom.visibility === "PRIVATE") {
                setJoinPassword("");
                setInviteCode(previewRoom.inviteCode);
                setShowJoin(true);
              } else {
                joinRoom.mutateAsync({ inviteCode: previewRoom.inviteCode });
              }
            }} disabled={joinRoom.isPending}>
              {joinRoom.isPending ? "Joining..." : "Join This Room"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">Room not found.</p>
        )}
      </Modal>
    </div>
  );
}
