import { useState } from "react";
import { useNavigate } from "react-router";
import { useUpdateRoom, useDeleteRoom } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";
import { Lock, Globe } from "lucide-react";

interface Props {
  room: CoLearningRoomFull;
}

export function RoomSettingsTab({ room }: Props) {
  const navigate = useNavigate();
  const updateRoom = useUpdateRoom(room.id);
  const deleteRoom = useDeleteRoom();

  const [name, setName] = useState(room.name);
  const [topic, setTopic] = useState(room.topic);
  const [description, setDescription] = useState(room.description ?? "");
  const [maxMembers, setMaxMembers] = useState(room.maxMembers);
  const [saved, setSaved] = useState(false);

  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(room.visibility);
  const [newPassword, setNewPassword] = useState("");
  const [visSaved, setVisSaved] = useState(false);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRoom.mutateAsync({ name, topic, description: description || undefined, maxMembers });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveVisibility = async () => {
    await updateRoom.mutateAsync({
      visibility,
      password: visibility === "PRIVATE" && newPassword ? newPassword : undefined,
    });
    setNewPassword("");
    setVisSaved(true);
    setTimeout(() => setVisSaved(false), 2000);
  };

  const handleDeleteRoom = async () => {
    if (confirm("Delete this room and all its data permanently? This cannot be undone.")) {
      await deleteRoom.mutateAsync(room.id);
      navigate("/rooms");
    }
  };

  return (
    <div className="space-y-8">
      {/* General Info */}
      <div>
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">General</h2>
        <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Room Name</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Topic</label>
            <input
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] h-20 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional room description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Max Members</label>
            <input
              type="number"
              min={2}
              max={50}
              className="w-24 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" type="submit" disabled={updateRoom.isPending} className="text-sm">
              {updateRoom.isPending ? "Saving..." : "Save"}
            </Button>
            {saved && <span className="text-xs text-green-400">Saved!</span>}
          </div>
        </form>
      </div>

      {/* Visibility */}
      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">Visibility</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Public rooms let anyone with the invite code join. Private rooms require a password.
        </p>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setVisibility("PUBLIC")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              visibility === "PUBLIC"
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
            }`}
          >
            <Globe size={16} />
            Public
          </button>
          <button
            type="button"
            onClick={() => setVisibility("PRIVATE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              visibility === "PRIVATE"
                ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-yellow-400"
            }`}
          >
            <Lock size={16} />
            Private
          </button>
        </div>

        {visibility === "PRIVATE" && (
          <div className="max-w-lg space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                {room.passwordHash ? "Reset Password" : "Set Password"}
              </label>
              <input
                type="password"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={room.passwordHash ? "Enter new password (min 4 chars)" : "Enter password (min 4 chars)"}
                minLength={4}
              />
              {room.passwordHash && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">Leave blank to keep current password.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <Button variant="primary" onClick={handleSaveVisibility} disabled={updateRoom.isPending} className="text-sm">
            {updateRoom.isPending ? "Saving..." : "Save Visibility"}
          </Button>
          {visSaved && <span className="text-xs text-green-400">Saved!</span>}
        </div>
      </div>

      {/* Invite Code */}
      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Invite Code</h3>
        <div className="flex items-center gap-3">
          <code className="text-lg bg-[var(--bg)] border border-[var(--border)] px-4 py-2 rounded-lg font-mono tracking-widest">
            {room.inviteCode}
          </code>
          <Button
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(room.inviteCode)}
            className="text-sm"
          >
            Copy
          </Button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Share this code with others to let them join.</p>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-[var(--border)] pt-6">
        <div className="border border-red-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-red-400 mb-3">Danger Zone</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Permanently delete this room and all its data. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDeleteRoom} disabled={deleteRoom.isPending} className="text-sm">
            {deleteRoom.isPending ? "Deleting..." : "Delete Room"}
          </Button>
        </div>
      </div>
    </div>
  );
}
