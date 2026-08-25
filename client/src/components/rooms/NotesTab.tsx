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
  ChevronDown,
  Download,
  Image,
  Video,
  File,
  Loader2,
} from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { RoomNote } from "../../types";

interface NotesTabProps {
  roomId: string;
  isAdmin: boolean;
}

function getFileIcon(title: string, size = 16) {
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
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);
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

  if (folders.length === 0 && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
        <Folder size={40} className="mb-3 opacity-30" />
        <p className="text-sm">No folders yet</p>
        <p className="text-xs mt-1 opacity-60">Admin will create folders from syllabus</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* New folder button */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-3">
          {showNewFolder ? (
            <div className="flex items-center gap-2 flex-1">
              <Folder size={16} className="text-[var(--accent)]" />
              <input
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
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
              <button
                onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
            >
              <Plus size={14} /> New Folder
            </button>
          )}
        </div>
      )}
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        const files = folder.children || [];
        const isUploading = uploadingTo === folder.id;

        return (
          <div key={folder.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Folder header */}
            <div
              className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"
              onClick={() => toggleFolder(folder.id)}
            >
              <ChevronRight
                size={16}
                className={cn("text-[var(--text-secondary)] transition-transform", isExpanded && "rotate-90")}
              />
              {isExpanded ? (
                <FolderOpen size={18} className="text-[var(--accent)]" />
              ) : (
                <Folder size={18} className="text-[var(--accent)]" />
              )}
              <span className="font-medium text-[var(--text-primary)] flex-1">{folder.title}</span>
              <span className="text-xs text-[var(--text-secondary)]">
                {files.length} {files.length === 1 ? "file" : "files"}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleUpload(folder.id)}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                    title="Upload files"
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    onClick={() => setShowNewFile(showNewFile === folder.id ? null : folder.id)}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                    title="Create file"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete folder "${folder.title}" and all its files?`)) deleteNote.mutate(folder.id);
                    }}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete folder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* New file input */}
            {showNewFile === folder.id && (
              <div className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center gap-2">
                <input
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
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
            {isExpanded && (
              <div className="border-t border-[var(--border)]">
                {files.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)] opacity-60">
                    No files yet. Upload or create a file.
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] border-b border-[var(--border)] last:border-b-0 group"
                    >
                      <span className="ml-4">{getFileIcon(file.title, 16)}</span>
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{file.title}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : ""}
                      </span>
                      {file.content && file.fileType !== "TEXT" && file.fileType !== "CODE" && (
                        <a
                          href={file.content}
                          download={file.fileName || file.title}
                          className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={14} />
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${file.title}"?`)) deleteNote.mutate(file.id);
                          }}
                          className="p-1 text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
