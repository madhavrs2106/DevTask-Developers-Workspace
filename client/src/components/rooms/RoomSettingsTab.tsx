import { useState } from "react";
import { useNavigate } from "react-router";
import { useUpdateRoom, useDeleteRoom, useRemoveRoomMember } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

export function RoomSettingsTab({ room }: Props) {
  const navigate = useNavigate();
  const updateRoom = useUpdateRoom(room.id);
  const deleteRoom = useDeleteRoom();
  const removeMember = useRemoveRoomMember(room.id);

  const [name, setName] = useState(room.name);
  const [topic, setTopic] = useState(room.topic);
  const [description, setDescription] = useState(room.description ?? "");
  const [maxMembers, setMaxMembers] = useState(room.maxMembers);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRoom.mutateAsync({
      name,
      topic,
      description: description || undefined,
      maxMembers,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (confirm(`Remove @${username} from this room?`)) {
      await removeMember.mutateAsync(userId);
    }
  };

  const handleDeleteRoom = async () => {
    if (confirm("Delete this room and all its data permanently? This cannot be undone.")) {
      await deleteRoom.mutateAsync(room.id);
      navigate("/rooms");
    }
  };

  return (
    <div className="space-y-8">
      {/* Room Info */}
      <div>
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Room Settings</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
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
              {updateRoom.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {saved && <span className="text-xs text-green-400">Saved!</span>}
          </div>
        </form>
      </div>

      {/* Invite Code */}
      <div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Invite Code</h3>
        <div className="flex items-center gap-3">
          <code className="text-lg bg-[var(--bg)] border border-[var(--border)] px-4 py-2 rounded-lg font-mono tracking-widest">
            {room.inviteCode}
          </code>
          <Button
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(room.inviteCode);
            }}
            className="text-sm"
          >
            Copy
          </Button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Share this code with others to let them join.</p>
      </div>

      {/* Danger Zone */}
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
  );
}
