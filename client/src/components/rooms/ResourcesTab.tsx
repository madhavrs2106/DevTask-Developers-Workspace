import { useState, useMemo } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  ExternalLink,
  Trash2,
  Plus,
  ChevronRight,
  GitBranch,
  Code2,
  Link as LinkIcon,
  Video,
  File,
} from "lucide-react";
import { useAddResource, useDeleteResource } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { CoLearningRoomFull, RoomResource } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

const RESOURCE_TYPES = [
  { value: "LINK", label: "Link", icon: LinkIcon },
  { value: "NOTE", label: "Note", icon: FileText },
  { value: "REPO", label: "Repo", icon: GitBranch },
  { value: "VIDEO", label: "Video", icon: Video },
];

function getResourceIcon(type: RoomResource["type"]) {
  switch (type) {
    case "REPO":
      return <GitBranch size={14} className="text-[var(--accent)]" />;
    case "NOTE":
      return <FileText size={14} className="text-green-400" />;
    case "VIDEO":
      return <Video size={14} className="text-purple-400" />;
    default:
      return <LinkIcon size={14} className="text-blue-400" />;
  }
}

function getFileIcon(type: RoomResource["type"]) {
  switch (type) {
    case "REPO":
      return <Code2 size={16} className="text-[var(--accent)]" />;
    case "NOTE":
      return <FileText size={16} className="text-green-400" />;
    case "VIDEO":
      return <Video size={16} className="text-purple-400" />;
    default:
      return <File size={16} className="text-blue-400" />;
  }
}

function timeAgo(date: string) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TreeItem {
  type: "file" | "folder";
  name: string;
  path: string;
  resource?: RoomResource;
  children?: TreeItem[];
}

function buildFileTree(resources: RoomResource[]): TreeItem[] {
  const root: TreeItem[] = [];
  const folderMap = new Map<string, TreeItem>();

  const sorted = [...resources].sort((a, b) => {
    const aPath = a.path || "";
    const bPath = b.path || "";
    if (aPath !== bPath) return aPath.localeCompare(bPath);
    return a.title.localeCompare(b.title);
  });

  for (const res of sorted) {
    const path = res.path || "";
    const parts = path.split("/").filter(Boolean);

    let currentLevel = root;
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let folder = folderMap.get(currentPath);
      if (!folder) {
        folder = { type: "folder", name: part, path: currentPath, children: [] };
        folderMap.set(currentPath, folder);
        currentLevel.push(folder);
      }
      currentLevel = folder.children!;
    }

    currentLevel.push({
      type: "file",
      name: res.title,
      path: res.path || "",
      resource: res,
    });
  }

  return root;
}

export function ResourcesTab({ room }: Props) {
  const addResource = useAddResource(room.id);
  const deleteResource = useDeleteResource(room.id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("LINK");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fileTree = useMemo(() => buildFileTree(room.resources), [room.resources]);

  const currentItems = useMemo(() => {
    let items = fileTree;
    for (const folder of currentFolder) {
      const found = items.find((i) => i.type === "folder" && i.name === folder);
      if (found?.children) {
        items = found.children;
      } else {
        return [];
      }
    }
    return items;
  }, [fileTree, currentFolder]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderPath = currentFolder.join("/");
    await addResource.mutateAsync({
      title,
      url,
      type,
      description: description || undefined,
      path: folderPath || undefined,
    });
    setTitle("");
    setUrl("");
    setType("LINK");
    setDescription("");
    setShowForm(false);
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm("Delete this resource?")) {
      await deleteResource.mutateAsync(resourceId);
    }
  };

  const navigateToRoot = () => setCurrentFolder([]);

  const navigateUp = () => setCurrentFolder((prev) => prev.slice(0, -1));

  const navigateToFolder = (index: number) => setCurrentFolder((prev) => prev.slice(0, index));

  const totalFiles = room.resources.length;
  const repoName = room.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-4">
      {/* ── Repo Header ────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <FolderOpen size={16} className="text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {repoName}
          </h3>
          <span className="text-xs text-[var(--text-secondary)]">
            Public
          </span>
        </div>

        {room.description && (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">{room.description}</p>
          </div>
        )}

        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)]/50">
          <button
            onClick={navigateToRoot}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            {repoName}
          </button>
          {currentFolder.map((folder, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-[var(--text-secondary)]" />
              <button
                onClick={() => navigateToFolder(i + 1)}
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {folder}
              </button>
            </span>
          ))}
        </div>

        {/* ── File List Header ────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)]/30">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {totalFiles} file{totalFiles !== 1 ? "s" : ""}
          </span>
          {currentFolder.length > 0 && (
            <button
              onClick={navigateUp}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              .. 
            </button>
          )}
        </div>

        {/* ── File Tree ───────────────────────────────────────── */}
        {room.resources.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-50" />
            <p className="text-sm text-[var(--text-secondary)]">
              No resources yet
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Add links, notes, repos, and videos to share with the group.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {currentItems.map((item) => {
              if (item.type === "folder") {
                const folderCount = countItems(item);
                return (
                  <button
                    key={item.name}
                    onClick={() => setCurrentFolder((prev) => [...prev, item.name])}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[var(--bg)] transition-colors"
                  >
                    <Folder size={16} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.name}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {folderCount} item{folderCount !== 1 ? "s" : ""}
                    </span>
                  </button>
                );
              }

              const res = item.resource!;
              return (
                <div
                  key={res.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg)] transition-colors group"
                  onMouseEnter={() => setHoveredId(res.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {getFileIcon(res.type)}
                  <div className="min-w-0 flex-1">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline"
                    >
                      {res.title}
                    </a>
                    {res.description && (
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                        {res.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] shrink-0">
                    {timeAgo(res.createdAt)}
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {hoveredId === res.id && (
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="shrink-0 p-1 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add File Form ──────────────────────────────────────── */}
      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-[var(--accent)]" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Add file</h4>
          </div>

          <div className="flex gap-2">
            <select
              className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="File name (e.g., setup-guide.md)"
              required
            />
          </div>

          <input
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
          />

          <input
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add file description (optional)"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Add to folder:</span>
            <input
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="docs/ or src/utils/"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-sm">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={addResource.isPending}
              className="text-sm"
            >
              {addResource.isPending ? "Adding..." : "Add file"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-[var(--border)] hover:border-[var(--accent)] text-sm"
        >
          <Plus size={16} className="mr-2" />
          Add file
        </Button>
      )}
    </div>
  );
}

function countItems(item: TreeItem): number {
  if (item.type === "file") return 1;
  return item.children?.reduce((sum, child) => sum + countItems(child), 0) ?? 0;
}
