import { useState } from "react";
import { useAddResource } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

const RESOURCE_TYPES = [
  { value: "LINK", label: "Link" },
  { value: "NOTE", label: "Note" },
  { value: "REPO", label: "Repo" },
  { value: "VIDEO", label: "Video" },
];

export function ResourcesTab({ room }: Props) {
  const addResource = useAddResource(room.id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("LINK");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addResource.mutateAsync({ title, url, type });
    setTitle("");
    setUrl("");
    setType("LINK");
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Resource Hub</h2>
        <Button variant="ghost" onClick={() => setShowForm(!showForm)} className="text-sm">
          {showForm ? "Cancel" : "+ Add Resource"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 mb-4 space-y-3">
          <div className="flex gap-2">
            <select
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              required
            />
          </div>
          <input
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
          />
          <Button variant="primary" type="submit" disabled={addResource.isPending} className="text-sm">
            {addResource.isPending ? "Adding..." : "Add"}
          </Button>
        </form>
      )}

      {room.resources.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          No resources shared yet. Pin repos, cheat sheets, and tutorials.
        </p>
      ) : (
        <div className="space-y-2">
          {room.resources.map((res) => (
            <a
              key={res.id}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
            >
              <span className="text-lg">
                {res.type === "REPO" ? "📦" : res.type === "VIDEO" ? "🎬" : res.type === "NOTE" ? "📝" : "🔗"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{res.title}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{res.url}</p>
              </div>
              <span className="text-xs text-[var(--text-secondary)] shrink-0">
                by {res.addedBy.username}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
