import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useMyRooms,
  useCreateRoom,
  useJoinRoom,
} from "../hooks/useQueries";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Users } from "lucide-react";

export default function CoLearningRoomsPage() {
  const { data: rooms, isLoading } = useMyRooms();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoom.mutateAsync({ name, topic, description: description || undefined });
    setName("");
    setTopic("");
    setDescription("");
    setShowCreate(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinRoom.mutateAsync(inviteCode.toUpperCase());
    setInviteCode("");
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)] truncate">{room.name}</h3>
                  <p className="text-sm text-[var(--accent)]">{room.topic}</p>
                </div>
                {room.role === "ADMIN" && (
                  <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full shrink-0">
                    Admin
                  </span>
                )}
              </div>
              {room.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{room.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                <span>{room.memberCount} member{room.memberCount !== 1 ? "s" : ""}</span>
                {room.streakCount > 0 && (
                  <span className="text-orange-400">🔥 {room.streakCount} day streak</span>
                )}
              </div>
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
              placeholder="What will you study together?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join Room">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Invite Code</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono text-center text-lg tracking-widest focus:outline-none focus:border-[var(--accent)]"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX"
              required
              maxLength={8}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Ask a room admin for the 8-character invite code.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setShowJoin(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={joinRoom.isPending || inviteCode.length < 4}>
              {joinRoom.isPending ? "Joining..." : "Join"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
