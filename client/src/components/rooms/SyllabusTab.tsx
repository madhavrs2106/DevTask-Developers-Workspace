import { useState } from "react";
import {
  useAddSyllabusItem,
  useToggleSyllabusComplete,
  useDeleteSyllabusItem,
} from "../../hooks/useQueries";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

export function SyllabusTab({ room }: Props) {
  const { user } = useAuth();
  const addItem = useAddSyllabusItem(room.id);
  const toggleComplete = useToggleSyllabusComplete(room.id);
  const deleteItem = useDeleteSyllabusItem(room.id);

  const isAdmin = room.members.some(
    (m) => m.user.id === user?.id && m.role === "ADMIN"
  );

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addItem.mutateAsync({
      title,
      description: description || undefined,
      resourceUrl: resourceUrl || undefined,
    });
    setTitle("");
    setDescription("");
    setResourceUrl("");
    setShowForm(false);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Delete this syllabus item?")) {
      await deleteItem.mutateAsync(itemId);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Syllabus & Milestones</h2>
        {isAdmin && (
          <Button variant="ghost" onClick={() => setShowForm(!showForm)} className="text-sm">
            {showForm ? "Cancel" : "+ Add Topic"}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 mb-4 space-y-3">
          <input
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title (e.g. Arrays & Hashing)"
            required
          />
          <textarea
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] h-16 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <input
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="Resource URL (optional)"
          />
          <Button variant="primary" type="submit" disabled={addItem.isPending} className="text-sm">
            {addItem.isPending ? "Adding..." : "Add Topic"}
          </Button>
        </form>
      )}

      {room.syllabusItems.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          {isAdmin
            ? "No topics yet. Add topics and milestones to track group progress."
            : "No syllabus items yet. The admin will add topics soon."}
        </p>
      ) : (
        <div className="space-y-2">
          {room.syllabusItems.map((item) => {
            const isComplete = item.completions.some((c) => c.userId === user?.id);
            const completedMembers = item.completions.map((c) => {
              const member = room.members.find((m) => m.user.id === c.userId);
              return member?.user;
            }).filter(Boolean);
            const memberCount = room.members.length;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isComplete
                    ? "bg-[var(--accent)]/5 border-[var(--accent)]/30"
                    : "bg-[var(--bg-card)] border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComplete.mutateAsync(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isComplete
                        ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {isComplete && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isComplete ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 whitespace-pre-line">{item.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-400 hover:text-red-300 shrink-0 px-1"
                      title="Delete topic"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {/* Member completion avatars */}
                <div className="flex items-center gap-1 mt-2 ml-9">
                  <div className="flex -space-x-1.5">
                    {completedMembers.slice(0, 8).map((m) => (
                      <div
                        key={m!.id}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-[var(--bg-card)]"
                        style={{ backgroundColor: m!.avatarColor }}
                        title={m!.username}
                      >
                        {m!.username[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] ml-1">
                    {completedMembers.length}/{memberCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
