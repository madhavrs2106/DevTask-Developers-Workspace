import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Code2,
  Image,
  Video,
  File,
  Plus,
  Upload,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit3,
  Check,
  X,
  Play,
  Terminal,
  Search,
  MoreVertical,
  Save,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  Settings,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { CodeRunner } from "./CodeRunner";
import { JupyterNotebook } from "./JupyterNotebook";
import { cn } from "../../lib/utils";
import type { CoLearningRoomFull, RoomNote } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

interface OpenTab {
  noteId: string;
  modified: boolean;
}

const qk = {
  notes: (roomId: string) => ["roomNotes", roomId],
};

function getFileIcon(title: string): typeof File {
  const ext = title.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, typeof File> = {
    js: Code2,
    jsx: Code2,
    ts: Code2,
    tsx: Code2,
    py: Code2,
    html: FileText,
    css: FileText,
    json: FileText,
    md: FileText,
    txt: FileText,
    sh: Terminal,
    sql: FileText,
    yaml: Settings,
    yml: Settings,
    xml: FileText,
    toml: Settings,
    zip: File,
    tar: File,
    gz: File,
    "7z": File,
    rar: File,
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    webp: Image,
    svg: Image,
    mp4: Video,
    mkv: Video,
    webm: Video,
    mov: Video,
    avi: Video,
  };
  return map[ext] || File;
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    htm: "html",
    css: "css",
    json: "json",
    md: "markdown",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    toml: "toml",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    dart: "dart",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    r: "r",
    lua: "lua",
    pl: "perl",
  };
  return map[ext] || ext;
}

function TreeItem({
  note,
  depth,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  onDelete,
  isAdmin,
}: {
  note: RoomNote;
  depth: number;
  selectedId: string | null;
  onSelect: (note: RoomNote) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  const isFolder = note.type === "FOLDER";
  const isExpanded = expandedIds.has(note.id);
  const isSelected = selectedId === note.id;
  const Icon = isFolder ? (isExpanded ? FolderOpen : Folder) : getFileIcon(note.title);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs group hover:bg-[var(--accent)]/10",
          isSelected && "bg-[var(--accent)]/20 text-[var(--accent)]",
          !isSelected && "text-[var(--text-primary)]"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            onToggleExpand(note.id);
          } else {
            onSelect(note);
          }
        }}
      >
        {isFolder && (
          <ChevronRight
            size={12}
            className={cn("shrink-0 transition-transform", isExpanded && "rotate-90")}
          />
        )}
        <Icon size={14} className="shrink-0 text-[var(--text-secondary)]" />
        <span className="truncate flex-1">{note.title}</span>
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${note.title}"?`)) onDelete(note.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-opacity"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
      {isFolder && isExpanded && note.children && (
        <div>
          {note.children.map((child) => (
            <TreeItem
              key={child.id}
              note={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CodeEditorView({
  note,
  roomId,
  isAdmin,
  onSave,
  onClose,
  isModified,
}: {
  note: RoomNote;
  roomId: string;
  isAdmin: boolean;
  onSave: (content: string) => void;
  onClose: () => void;
  isModified: boolean;
}) {
  const [content, setContent] = useState(note.content || "");
  const [running, setRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(note.content || "");
  }, [note.id, note.content]);

  const lineCount = content.split("\n").length;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave(content);
    }
  };

  const lang = getLanguageFromFileName(note.title);
  const canRun = ["javascript", "js", "typescript", "ts", "html", "htm", "python", "py"].includes(lang);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg)]">
      {/* Editor header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          {(() => {
            const Icon = getFileIcon(note.title);
            return <Icon size={14} className="text-[var(--text-secondary)]" />;
          })()}
          <span className="text-xs text-[var(--text-primary)] truncate">{note.title}</span>
          {isModified && <span className="text-xs text-yellow-400">●</span>}
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.5 rounded">
            {lang}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="ghost"
              onClick={() => onSave(content)}
              disabled={!isModified}
              className="text-xs px-2 py-1 gap-1"
            >
              <Save size={12} />
              Save
            </Button>
          )}
          {canRun && (
            <Button variant="ghost" className="text-xs px-2 py-1 gap-1 text-green-400">
              <Play size={12} />
              Run
            </Button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--accent)]/10 text-[var(--text-secondary)]">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 shrink-0 bg-[var(--bg-card)] border-r border-[var(--border)] overflow-hidden select-none"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-xs text-[var(--text-secondary)] text-right pr-2 leading-5 h-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area */}
        <div className="flex-1 relative">
          {isAdmin ? (
            <textarea
              ref={textareaRef}
              className="absolute inset-0 w-full h-full bg-transparent text-[var(--text-primary)] p-2 resize-none focus:outline-none overflow-auto"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontSize: "13px",
                lineHeight: "20px",
                tabSize: 2,
                whiteSpace: "pre",
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              readOnly={false}
            />
          ) : (
            <pre
              className="absolute inset-0 w-full h-full p-2 overflow-auto text-[var(--text-primary)]"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontSize: "13px",
                lineHeight: "20px",
                tabSize: 2,
                whiteSpace: "pre",
              }}
            >
              {content || "Empty file"}
            </pre>
          )}
        </div>
      </div>

      {/* Code runner for code files */}
      {canRun && (
        <div className="border-t border-[var(--border)]">
          <CodeRunner code={content} language={lang} fileName={note.title} />
        </div>
      )}

      {/* Jupyter notebook for .ipynb */}
      {note.title.endsWith(".ipynb") && (
        <div className="flex-1 overflow-auto p-4">
          <JupyterNotebook initialContent={content} />
        </div>
      )}
    </div>
  );
}

export function CodeEditor({ room }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = room.creator.id === user?.id;

  const [selectedNote, setSelectedNote] = useState<RoomNote | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(220);

  const { data, isLoading } = useQuery({
    queryKey: qk.notes(room.id),
    queryFn: async () => (await api.get<{ notes: RoomNote[] }>(`/rooms/${room.id}/notes`)).data,
  });

  const createNote = useMutation({
    mutationFn: async (input: { title: string; type: string; fileType?: string; parentId?: string | null }) =>
      (await api.post(`/rooms/${room.id}/notes`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notes(room.id) });
      setNewFolderName("");
      setShowNewFolder(false);
      setNewFileName("");
      setShowNewFile(false);
    },
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      if (parentId) formData.append("parentId", parentId);
      return (await api.post(`/rooms/${room.id}/notes/upload`, formData)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notes(room.id) });
      setParentId(null);
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) =>
      (await api.put(`/rooms/${room.id}/notes/${id}`, { content })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notes(room.id) });
      setOpenTabs((prev) => prev.map((t) => ({ ...t, modified: false })));
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/rooms/${room.id}/notes/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notes(room.id) });
      setSelectedNote(null);
      setOpenTabs([]);
      setActiveTabId(null);
    },
  });

  const notes = data?.notes ?? [];

  const buildTree = (items: RoomNote[], parentId: string | null = null): RoomNote[] => {
    return items
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type === "FOLDER" && b.type !== "FOLDER") return -1;
        if (a.type !== "FOLDER" && b.type === "FOLDER") return 1;
        return a.title.localeCompare(b.title);
      })
      .map((note) => ({
        ...note,
        children: items.filter((n) => n.parentId === note.id).length > 0
          ? buildTree(items, note.id)
          : undefined,
      }));
  };

  const tree = buildTree(notes);

  useEffect(() => {
    if (tree.length > 0) {
      const rootIds = tree.filter((n) => n.type === "FOLDER").map((n) => n.id);
      setExpandedIds(new Set(rootIds));
    }
  }, [data]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openNote = useCallback(
    (note: RoomNote) => {
      if (note.type === "FOLDER") return;
      setSelectedNote(note);
      setActiveTabId(note.id);
      if (!openTabs.find((t) => t.noteId === note.id)) {
        setOpenTabs((prev) => [...prev, { noteId: note.id, modified: false }]);
      }
    },
    [openTabs]
  );

  const closeTab = useCallback(
    (noteId: string) => {
      const tab = openTabs.find((t) => t.noteId === noteId);
      if (tab?.modified && !confirm("Discard unsaved changes?")) return;
      setOpenTabs((prev) => prev.filter((t) => t.noteId !== noteId));
      if (activeTabId === noteId) {
        const remaining = openTabs.filter((t) => t.noteId !== noteId);
        if (remaining.length > 0) {
          const lastTab = remaining[remaining.length - 1];
          setActiveTabId(lastTab.noteId);
          setSelectedNote(notes.find((n) => n.id === lastTab.noteId) || null);
        } else {
          setActiveTabId(null);
          setSelectedNote(null);
        }
      }
    },
    [openTabs, activeTabId, notes]
  );

  const handleSave = useCallback(
    (content: string) => {
      if (!activeTabId || !isAdmin) return;
      updateNote.mutate({ id: activeTabId, content });
    },
    [activeTabId, isAdmin, updateNote]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      setOpenTabs((prev) =>
        prev.map((t) => (t.noteId === activeTabId ? { ...t, modified: true } : t))
      );
    },
    [activeTabId]
  );

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createNote.mutate({ title: newFolderName, type: "FOLDER", parentId });
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    createNote.mutate({ title: newFileName, type: "FILE", fileType: "TEXT", parentId });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => uploadFile.mutate(file));
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Code Editor</span>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowNewFolder(true)} className="text-xs gap-1.5">
              <Folder size={12} />
              New Folder
            </Button>
            <Button variant="ghost" onClick={() => setShowNewFile(true)} className="text-xs gap-1.5">
              <FileText size={12} />
              New File
            </Button>
            <label className="cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleUpload} />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors">
                <Upload size={12} />
                Upload
              </span>
            </label>
          </div>
        )}
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <div className="flex gap-2 px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)]">
          <input
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent)]"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
          <Button variant="primary" onClick={handleCreateFolder} disabled={createNote.isPending} className="text-xs">
            Create
          </Button>
          <Button variant="ghost" onClick={() => setShowNewFolder(false)} className="text-xs">
            Cancel
          </Button>
        </div>
      )}

      {/* New File Form */}
      {showNewFile && (
        <div className="flex gap-2 px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)]">
          <input
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent)]"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="File name (e.g., index.js)"
            autoFocus
          />
          <Button variant="primary" onClick={handleCreateFile} disabled={createNote.isPending} className="text-xs">
            Create
          </Button>
          <Button variant="ghost" onClick={() => setShowNewFile(false)} className="text-xs">
            Cancel
          </Button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - File Explorer */}
        <div
          className="shrink-0 border-r border-[var(--border)] overflow-y-auto bg-[var(--bg-card)]"
          style={{ width: sidebarWidth }}
        >
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)]">
            Explorer
          </div>
          {tree.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
              <Folder size={24} className="mx-auto mb-2 opacity-30" />
              No files yet
            </div>
          ) : (
            <div className="py-1">
              {tree.map((note) => (
                <TreeItem
                  key={note.id}
                  note={note}
                  depth={0}
                  selectedId={activeTabId}
                  onSelect={openNote}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onDelete={(id) => {
                    if (confirm("Delete this file?")) deleteNote.mutate(id);
                  }}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          {openTabs.length > 0 && (
            <div className="flex items-center bg-[var(--bg-card)] border-b border-[var(--border)] overflow-x-auto">
              {openTabs.map((tab) => {
                const note = notes.find((n) => n.id === tab.noteId);
                if (!note) return null;
                const Icon = getFileIcon(note.title);
                const isActive = tab.noteId === activeTabId;
                return (
                  <div
                    key={tab.noteId}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-[var(--border)] cursor-pointer shrink-0 group",
                      isActive
                        ? "bg-[var(--bg)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg)]/50"
                    )}
                    onClick={() => {
                      setActiveTabId(tab.noteId);
                      setSelectedNote(note);
                    }}
                  >
                    <Icon size={12} />
                    <span>{note.title}</span>
                    {tab.modified && <span className="text-yellow-400">●</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.noteId);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--accent)]/10 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor content */}
          {selectedNote ? (
            <CodeEditorView
              key={selectedNote.id}
              note={selectedNote}
              roomId={room.id}
              isAdmin={isAdmin}
              onSave={handleSave}
              onClose={() => closeTab(selectedNote.id)}
              isModified={openTabs.find((t) => t.noteId === selectedNote.id)?.modified || false}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
              <div className="text-center">
                <Code2 size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a file to start editing</p>
                <p className="text-xs mt-1 text-[var(--text-secondary)]/60">
                  {isAdmin ? "Create, upload, or click a file from the explorer" : "Click a file from the explorer to view"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[var(--accent)]/10 border-t border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-3">
          <span>{notes.length} files</span>
          {selectedNote && (
            <span>
              Ln 1, Col 1 • {getLanguageFromFileName(selectedNote.title)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          {!isAdmin && <span className="text-yellow-400">Read Only</span>}
        </div>
      </div>
    </div>
  );
}
