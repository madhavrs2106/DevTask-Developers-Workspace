import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  Plus,
  Trash2,
  ChevronRight,
  Download,
  Image,
  Video,
  File,
  Loader2,
  FolderPlus,
} from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { RoomNote } from "../../types";

interface NotesTabProps {
  roomId: string;
  isAdmin: boolean;
}

function getFileIcon(title: string, size = 14) {
  const ext = title.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, typeof File> = {
    png: Image, jpg: Image, jpeg: Image, gif: Image, webp: Image, svg: Image,
    mp4: Video, mkv: Video, webm: Video,
    pdf: FileText, doc: FileText, docx: FileText, xls: FileText, xlsx: FileText,
  };
  const colorMap: Record<string, string> = {
    js: "text-yellow-400", jsx: "text-cyan-400", ts: "text-blue-400", py: "text-green-400",
    html: "text-orange-400", css: "text-blue-400", json: "text-yellow-300",
    md: "text-blue-300", txt: "text-[var(--text-secondary)]",
  };
  const Icon = iconMap[ext] || FileText;
  const color = colorMap[ext] || "text-[var(--text-secondary)]";
  return <Icon size={size} className={color} />;
}

export function NotesTab({ roomId, isAdmin }: NotesTabProps) {
  const queryClient = useQueryClient();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFile, setShowNewFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["roomNotes", roomId],
    queryFn: async () => (await api.get<{ notes: RoomNote[] }>(`/rooms/${roomId}/notes`)).data,
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, parentId }: { file: File; parentId: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      fd.append("parentId", parentId);
      return (await api.post(`/rooms/${roomId}/notes/upload`, fd)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }),
  });

  const createFile = useMutation({
    mutationFn: async ({ title, parentId }: { title: string; parentId: string }) =>
      (await api.post(`/rooms/${roomId}/notes`, { title, type: "FILE", fileType: "TEXT", parentId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] });
      setShowNewFile(null);
      setNewFileName("");
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => (await api.delete(`/rooms/${roomId}/notes/${noteId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }),
  });

  const createFolder = useMutation({
    mutationFn: async (title: string) =>
      (await api.post(`/rooms/${roomId}/notes`, { title, type: "FOLDER" })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] });
      setShowNewFolder(false);
      setNewFolderName("");
    },
  });

  const notes = data?.notes || [];
  const folders = notes.filter((n) => n.type === "FOLDER");

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpload = (folderId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = e.target.files as FileList;
      Array.from(files).forEach((f: File) => uploadFile.mutate({ file: f, parentId: folderId }));
    };
    input.click();
  };

  const handleCreateFile = (folderId: string) => {
    if (!newFileName.trim()) return;
    createFile.mutate({ title: newFileName, parentId: folderId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">Notes & Files</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {folders.length} {folders.length === 1 ? "folder" : "folders"}
          </p>
        </div>
        {isAdmin && (
          <Button variant="ghost" onClick={() => setShowNewFolder(!showNewFolder)} className="text-sm">
            {showNewFolder ? "Cancel" : "+ New Folder"}
          </Button>
        )}
      </div>

      {/* New folder form */}
      {showNewFolder && (
        <div className="card p-4 mb-4 flex items-center gap-2">
          <FolderPlus size={18} className="text-[var(--accent)] shrink-0" />
          <input
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) createFolder.mutate(newFolderName);
              if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
            }}
          />
          <Button
            size="sm"
            onClick={() => createFolder.mutate(newFolderName)}
            disabled={!newFolderName.trim() || createFolder.isPending}
          >
            {createFolder.isPending ? <Loader2 size={14} className="animate-spin" /> : "Create"}
          </Button>
        </div>
      )}

      {/* Folders */}
      {folders.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          {isAdmin
            ? "No folders yet. Create folders or add syllabus items to organize files."
            : "No folders yet. The admin will add folders soon."}
        </p>
      ) : (
        <ul className="space-y-2">
          {folders.map((folder, index) => {
            const isExpanded = expandedFolders.has(folder.id);
            const files = folder.children || [];

            return (
              <li key={folder.id}>
                {/* Folder card */}
                <article className="card group">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {/* Number */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isExpanded ? "bg-[var(--accent)]/20" : "bg-[var(--bg-secondary)]"
                    )}>
                      {isExpanded ? (
                        <FolderOpen size={16} className="text-[var(--accent)]" />
                      ) : (
                        <Folder size={16} className={cn(isExpanded ? "text-[var(--accent)]" : "text-[var(--text-secondary)]")} />
                      )}
                    </div>

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{folder.title}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {files.length} {files.length === 1 ? "file" : "files"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpload(folder.id); }}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                            title="Upload files"
                          >
                            <Upload size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowNewFile(showNewFile === folder.id ? null : folder.id); }}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                            title="Create file"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete folder "${folder.title}" and all its files?`)) deleteNote.mutate(folder.id);
                            }}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete folder"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* New file input */}
                  {showNewFile === folder.id && (
                    <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center gap-2">
                      <FileText size={14} className="text-[var(--text-secondary)] shrink-0" />
                      <input
                        className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="filename.js"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateFile(folder.id);
                          if (e.key === "Escape") setShowNewFile(null);
                        }}
                      />
                      <Button size="sm" onClick={() => handleCreateFile(folder.id)} disabled={!newFileName.trim()}>
                        Create
                      </Button>
                    </div>
                  )}

                  {/* Files */}
                  {isExpanded && files.length > 0 && (
                    <div className="border-t border-[var(--border)]">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] border-b border-[var(--border)] last:border-b-0 group/file"
                        >
                          <span className="ml-8">{getFileIcon(file.title)}</span>
                          <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{file.title}</span>
                          <span className="text-[11px] text-[var(--text-secondary)]">
                            {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : ""}
                          </span>
                          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/file:opacity-100 max-md:opacity-100">
                            {file.content && file.fileType !== "TEXT" && file.fileType !== "CODE" && (
                              <a
                                href={file.content}
                                download={file.fileName || file.title}
                                className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                                title="Download"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download size={13} />
                              </a>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${file.title}"?`)) deleteNote.mutate(file.id);
                                }}
                                className="p-1 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && files.length === 0 && (
                    <div className="px-4 py-6 text-center border-t border-[var(--border)]">
                      <p className="text-xs text-[var(--text-secondary)] opacity-60">
                        No files yet. {isAdmin ? "Upload or create a file." : ""}
                      </p>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
