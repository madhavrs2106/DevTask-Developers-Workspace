import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import {
  useAddSyllabusItem,
  useToggleSyllabusComplete,
  useDeleteSyllabusItem,
} from "../../hooks/useQueries";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
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

  const completedCount = room.syllabusItems.filter((item) =>
    item.completions.some((c) => c.userId === user?.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Syllabus & Milestones
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {completedCount} / {room.syllabusItems.length} completed
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            <Plus size={16} />
            Add Topic
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-3"
        >
          <input
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title (e.g. Arrays & Hashing)"
            required
          />
          <textarea
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] h-20 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <input
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="Resource URL (optional)"
          />
          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={addItem.isPending} className="gap-2">
              <Plus size={14} />
              {addItem.isPending ? "Adding..." : "Add Topic"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Items List */}
      {room.syllabusItems.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] border-dashed">
          <ListChecks size={40} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
          <p className="text-sm text-[var(--text-secondary)]">No topics yet</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isAdmin ? "Add topics to track group progress" : "The admin will add topics soon"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {room.syllabusItems.map((item, index) => {
            const isComplete = item.completions.some((c) => c.userId === user?.id);
            const completedMembers = item.completions
              .map((c) => room.members.find((m) => m.user.id === c.userId)?.user)
              .filter(Boolean);
            const memberCount = room.members.length;

            return (
              <div
                key={item.id}
                className={cn(
                  "group p-4 rounded-xl border transition-all",
                  isComplete
                    ? "bg-green-400/5 border-green-400/20"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]/30"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Completion Toggle */}
                  <button
                    onClick={() => toggleComplete.mutateAsync(item.id)}
                    className="mt-0.5 shrink-0"
                  >
                    {isComplete ? (
                      <CheckCircle2 size={22} className="text-green-400" />
                    ) : (
                      <Circle size={22} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p
                        className={cn(
                          "text-base font-semibold",
                          isComplete ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"
                        )}
                      >
                        {item.title}
                      </p>
                    </div>

                    {item.description && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-line">
                        {item.description}
                      </p>
                    )}

                    {item.resourceUrl && (
                      <a
                        href={item.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-[var(--accent)] hover:underline"
                      >
                        <ExternalLink size={12} />
                        Resource
                      </a>
                    )}

                    {/* Member Completion */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-1.5">
                        {completedMembers.slice(0, 10).map((m) => (
                          <div
                            key={m!.id}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-[var(--bg-card)]"
                            style={{ backgroundColor: m!.avatarColor }}
                            title={m!.username}
                          >
                            {m!.avatarUrl ? (
                              <img src={m!.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              m!.username[0].toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {completedMembers.length}/{memberCount}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
