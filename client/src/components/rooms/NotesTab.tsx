import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  Plus,
  Trash2,
  Download,
  Image,
  Video,
  Loader2,
  FolderPlus,
  Eye,
  AlertCircle,
} from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { RoomNote } from "../../types";

interface NotesTabProps {
  roomId: string;
  isAdmin: boolean;
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);
const DOC_EXTS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf"]);
const VIDEO_EXTS = new Set(["mp4", "mkv", "webm", "avi", "mov", "wmv", "mpeg"]);

function getExt(title: string) {
  return title.split(".").pop()?.toLowerCase() || "";
}

function isImage(title: string) {
  return IMAGE_EXTS.has(getExt(title));
}

function isVideo(title: string) {
  return VIDEO_EXTS.has(getExt(title));
}

function isDoc(title: string) {
  return DOC_EXTS.has(getExt(title));
}

function getFileIcon(title: string, size = 14) {
  const ext = getExt(title);
  if (isImage(title)) return <Image size={size} className="text-purple-400" />;
  if (isVideo(title)) return <Video size={size} className="text-pink-400" />;
  if (isDoc(title)) return <FileText size={size} className="text-orange-400" />;
  const colorMap: Record<string, string> = {
    js: "text-yellow-400", jsx: "text-cyan-400", ts: "text-blue-400", py: "text-green-400",
    html: "text-orange-400", css: "text-blue-400", json: "text-yellow-300",
    md: "text-blue-300", txt: "text-[var(--text-secondary)]",
  };
  return <FileText size={size} className={colorMap[ext] || "text-[var(--text-secondary)]"} />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NotesTab({ roomId, isAdmin }: NotesTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFolderId, setUploadingFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFile, setShowNewFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewFile, setPreviewFile] = useState<RoomNote | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      const res = await api.post(`/rooms/${roomId}/notes/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] });
      setUploadError(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || "Upload failed";
      setUploadError(msg);
    },
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

  const handleUploadClick = (folderId: string) => {
    setUploadingFolderId(folderId);
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadingFolderId) return;

    for (let i = 0; i < files.length; i++) {
      await uploadFile.mutateAsync({ file: files[i], parentId: uploadingFolderId });
    }

    setUploadingFolderId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,.txt,.csv,.md,.json,.js,.ts,.py,.html,.css,.zip,.tar,.gz"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">Notes & Files</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {folders.length} {folders.length === 1 ? "folder" : "folders"} · Images, documents & code
          </p>
        </div>
        {isAdmin && (
          <Button variant="ghost" onClick={() => setShowNewFolder(!showNewFolder)} className="text-sm">
            {showNewFolder ? "Cancel" : "+ New Folder"}
          </Button>
        )}
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto">×</button>
        </div>
      )}

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
          {folders.map((folder) => {
            const isExpanded = expandedFolders.has(folder.id);
            const files = folder.children || [];
            const isUploading = uploadingFolderId === folder.id;

            return (
              <li key={folder.id}>
                <article className="card group">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isExpanded ? "bg-[var(--accent)]/20" : "bg-[var(--bg-secondary)]"
                    )}>
                      {isExpanded ? (
                        <FolderOpen size={16} className="text-[var(--accent)]" />
                      ) : (
                        <Folder size={16} className="text-[var(--text-secondary)]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{folder.title}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {files.length} {files.length === 1 ? "file" : "files"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUploadClick(folder.id); }}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isUploading
                                ? "text-[var(--accent)] bg-[var(--accent)]/10"
                                : "text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
                            )}
                            title="Upload files"
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
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
                    <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] group/file"
                        >
                          <div className="ml-6 shrink-0">
                            {isImage(file.title) && file.content ? (
                              <div
                                className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden cursor-pointer hover:border-[var(--accent)] transition-colors"
                                onClick={() => setPreviewFile(file)}
                              >
                                <img
                                  src={file.content}
                                  alt={file.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </div>
                            ) : isVideo(file.title) && file.content ? (
                              <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                                <Video size={16} className="text-pink-400" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                                {getFileIcon(file.title, 16)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[var(--text-primary)] truncate">{file.title}</p>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {file.fileSize ? formatSize(file.fileSize) : ""}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/file:opacity-100 max-md:opacity-100">
                            {isImage(file.title) && file.content && (
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                                title="Preview"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            {file.content && (
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
                        No files yet. {isAdmin ? "Upload images, documents, or code files." : ""}
                      </p>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* Image preview modal */}
      {previewFile && previewFile.content && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm"
            >
              Close ✕
            </button>
            <img
              src={previewFile.content}
              alt={previewFile.title}
              className="max-w-full max-h-[85vh] mx-auto rounded-lg object-contain"
            />
            <p className="text-center text-white/70 text-sm mt-3">{previewFile.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
