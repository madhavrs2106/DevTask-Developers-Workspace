import { useState } from "react";
import {
  useAddSyllabusItem,
  useToggleSyllabusComplete,
  useDeleteSyllabusItem,
} from "../../hooks/useQueries";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Trash2, ExternalLink, CheckCircle2, Circle, Hash } from "lucide-react";
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
    if (confirm("Delete this syllabus item and its Notes folder?")) {
      await deleteItem.mutateAsync(itemId);
    }
  };

  const totalItems = room.syllabusItems.length;
  const completedByUser = room.syllabusItems.filter((item) =>
    item.completions.some((c) => c.userId === user?.id)
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">Syllabus & Milestones</h2>
          {totalItems > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {completedByUser}/{totalItems} completed
            </p>
          )}
        </div>
        {isAdmin && (
          <Button variant="ghost" onClick={() => setShowForm(!showForm)} className="text-sm">
            {showForm ? "Cancel" : "+ Add Topic"}
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 mb-4 space-y-3">
          <input
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title (e.g. Arrays & Hashing)"
            required
          />
          <textarea
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] h-16 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <input
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="Resource URL (optional)"
          />
          <Button variant="primary" type="submit" disabled={addItem.isPending} className="text-sm">
            {addItem.isPending ? "Adding..." : "Add Topic"}
          </Button>
        </form>
      )}

      {/* Items */}
      {room.syllabusItems.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          {isAdmin
            ? "No topics yet. Add topics and milestones to track group progress."
            : "No syllabus items yet. The admin will add topics soon."}
        </p>
      ) : (
        <ul className="space-y-2">
          {room.syllabusItems.map((item, index) => {
            const isComplete = item.completions.some((c) => c.userId === user?.id);
            const completedMembers = item.completions.map((c) => {
              const member = room.members.find((m) => m.user.id === c.userId);
              return member?.user;
            }).filter(Boolean);
            const memberCount = room.members.length;
            const completionPct = memberCount > 0 ? Math.round((completedMembers.length / memberCount) * 100) : 0;

            return (
              <li key={item.id}>
                <article className={cn(
                  "card group flex items-center gap-x-4 gap-y-2 px-4 py-3.5",
                  isComplete && "bg-[var(--accent)]/5 border-[var(--accent)]/20"
                )}>
                  {/* Number */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold",
                    isComplete
                      ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 size={18} className="text-[var(--accent)]" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "text-sm font-medium truncate",
                        isComplete ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                      )}>
                        {item.title}
                      </h4>
                      {item.resourceUrl && (
                        <a
                          href={item.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                          title="Resource link"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    {/* Member completion avatars */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex -space-x-1.5">
                        {completedMembers.slice(0, 6).map((m) => (
                          <div
                            key={m!.id}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border-2 border-[var(--bg-card)]"
                            style={{ backgroundColor: m!.avatarColor }}
                            title={m!.username}
                          >
                            {m!.username[0].toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {completedMembers.length}/{memberCount}
                      </span>
                      {completionPct > 0 && (
                        <div className="w-16 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden ml-1">
                          <div
                            className="h-full bg-[var(--accent)] rounded-full transition-all"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                    <button
                      onClick={() => toggleComplete.mutateAsync(item.id)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isComplete
                          ? "text-[var(--accent)] hover:bg-[var(--accent)]/10"
                          : "text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
                      )}
                      title={isComplete ? "Mark incomplete" : "Mark complete"}
                    >
                      {isComplete ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete topic"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
