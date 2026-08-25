import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Terminal,
  Settings,
  X,
  Save,
  GripVertical,
  ArrowLeft,
  Search,
  GitBranch,
  Blocks,
  Loader2,
  Download,
  Copy,
  Check,
  MoreVertical,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CodeRunner } from "../components/rooms/CodeRunner";
import { JupyterNotebook } from "../components/rooms/JupyterNotebook";
import { cn } from "../lib/utils";
import type { CoLearningRoomFull, RoomNote } from "../types";

interface OpenTab {
  noteId: string;
  modified: boolean;
}

function getFileIcon(title: string, size = 14): React.ReactNode {
  const ext = title.split(".").pop()?.toLowerCase() || "";
  const colorMap: Record<string, string> = {
    js: "text-yellow-400", jsx: "text-cyan-400", ts: "text-blue-400", tsx: "text-cyan-400",
    py: "text-green-400", ipynb: "text-orange-400",
    html: "text-orange-400", css: "text-blue-400", json: "text-yellow-300",
    md: "text-blue-300", txt: "text-[var(--text-secondary)]",
    sh: "text-green-300", bash: "text-green-300",
    sql: "text-blue-300", yaml: "text-pink-400", yml: "text-pink-400",
    xml: "text-orange-300", toml: "text-yellow-300",
    png: "text-purple-400", jpg: "text-purple-400", jpeg: "text-purple-400", gif: "text-purple-400", webp: "text-purple-400", svg: "text-green-400",
    mp4: "text-pink-400", mkv: "text-pink-400", webm: "text-pink-400",
    zip: "text-yellow-400", tar: "text-yellow-400", gz: "text-yellow-400",
  };
  const color = colorMap[ext] || "text-[var(--text-secondary)]";
  const iconMap: Record<string, typeof File> = {
    js: Code2, jsx: Code2, ts: Code2, tsx: Code2, py: Code2, ipynb: Code2,
    html: FileText, css: FileText, json: FileText, md: FileText, txt: FileText,
    sh: Terminal, bash: Terminal, sql: FileText, yaml: Settings, yml: Settings,
    xml: FileText, toml: Settings,
    png: Image, jpg: Image, jpeg: Image, gif: Image, webp: Image, svg: Image,
    mp4: Video, mkv: Video, webm: Video,
  };
  const Icon = iconMap[ext] || File;
  return <Icon size={size} className={color} />;
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", ipynb: "python", html: "html", htm: "html", css: "css", json: "json",
    md: "markdown", sh: "shell", bash: "shell", sql: "sql", yaml: "yaml", yml: "yaml",
    xml: "xml", toml: "toml", java: "java", c: "c", cpp: "cpp", cs: "csharp",
    go: "go", rs: "rust", rb: "ruby", php: "php", dart: "dart", swift: "swift",
  };
  return map[ext] || ext;
}

/* ─── Activity Bar (VS Code left icon strip) ─── */
function ActivityBar({ activePanel, onToggle }: { activePanel: string; onToggle: (p: string) => void }) {
  const items = [
    { id: "explorer", icon: Folder, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "runner", icon: Terminal, label: "Run & Debug" },
    { id: "extensions", icon: Blocks, label: "Extensions" },
  ];
  return (
    <div className="w-12 shrink-0 bg-[#252526] flex flex-col items-center py-1 border-r border-[#3c3c3c]">
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onToggle(id)}
          title={label}
          className={cn(
            "w-12 h-12 flex items-center justify-center transition-colors relative",
            activePanel === id
              ? "text-white"
              : "text-[#858585] hover:text-[#cccccc]"
          )}
        >
          {activePanel === id && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Icon size={22} strokeWidth={1.5} />
        </button>
      ))}
      <div className="flex-1" />
      <button title="Settings" className="w-12 h-12 flex items-center justify-center text-[#858585] hover:text-[#cccccc]">
        <Settings size={22} strokeWidth={1.5} />
      </button>
    </div>
  );
}

/* ─── File Explorer Sidebar ─── */
function FileExplorer({
  tree, activeFolderId, activeTabId, expandedIds, isAdmin, dragOverId,
  onSelect, onFolderSelect, onToggleExpand, onDelete, onMove, onDragOver,
  onCreateFolder, onCreateFile, onUpload,
}: {
  tree: RoomNote[]; activeFolderId: string | null; activeTabId: string | null;
  expandedIds: Set<string>; isAdmin: boolean; dragOverId: string | null;
  onSelect: (n: RoomNote) => void; onFolderSelect: (n: RoomNote) => void;
  onToggleExpand: (id: string) => void; onDelete: (id: string) => void;
  onMove: (noteId: string, parentId: string | null) => void;
  onDragOver: (id: string | null) => void;
  onCreateFolder: () => void; onCreateFile: () => void;
  onUpload: () => void;
}) {
  const [search, setSearch] = useState("");

  const filterTree = (items: RoomNote[], query: string): RoomNote[] => {
    if (!query) return items;
    return items.filter((n) => {
      const match = n.title.toLowerCase().includes(query.toLowerCase());
      const childMatch = n.children && filterTree(n.children, query).length > 0;
      return match || childMatch;
    }).map((n) => ({
      ...n,
      children: n.children ? filterTree(n.children, query) : undefined,
    }));
  };

  const displayTree = search ? filterTree(tree, search) : tree;

  return (
    <div className="h-full flex flex-col bg-[#252526] text-[#cccccc]">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 h-9 text-[11px] font-semibold uppercase tracking-wider text-[#bbbbbb] select-none">
        <span>Explorer</span>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={onCreateFile} title="New File" className="p-1 hover:bg-[#3c3c3c] rounded"><Plus size={14} /></button>
            <button onClick={onCreateFolder} title="New Folder" className="p-1 hover:bg-[#3c3c3c] rounded"><Folder size={14} /></button>
            <button onClick={onUpload} title="Upload" className="p-1 hover:bg-[#3c3c3c] rounded"><Upload size={14} /></button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#3c3c3c] rounded text-xs">
          <Search size={12} className="text-[#858585] shrink-0" />
          <input
            className="bg-transparent flex-1 focus:outline-none text-[#cccccc] placeholder-[#858585]"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto text-[13px]">
        {displayTree.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#858585] text-xs">
            {search ? "No matching files" : "No files yet"}
          </div>
        ) : (
          displayTree.map((note) => (
            <ExplorerItem
              key={note.id} note={note} depth={0} activeFolderId={activeFolderId}
              activeTabId={activeTabId} expandedIds={expandedIds} isAdmin={isAdmin}
              dragOverId={dragOverId} onSelect={onSelect} onFolderSelect={onFolderSelect}
              onToggleExpand={onToggleExpand} onDelete={onDelete} onMove={onMove}
              onDragOver={onDragOver}
            />
          ))
        )}
      </div>

      {/* Drop zone */}
      {isAdmin && (
        <div
          className={cn("border-t border-[#3c3c3c] p-2 text-center text-[10px] text-[#858585] transition-colors", dragOverId === "__root__" && "bg-[#094771]")}
          onDragOver={(e) => { e.preventDefault(); onDragOver("__root__"); }}
          onDragLeave={() => onDragOver(null)}
          onDrop={(e) => { e.preventDefault(); onMove(e.dataTransfer.getData("text/plain"), null); onDragOver(null); }}
        >
          Drop here for root
        </div>
      )}
    </div>
  );
}

function ExplorerItem({
  note, depth, activeFolderId, activeTabId, expandedIds, isAdmin, dragOverId,
  onSelect, onFolderSelect, onToggleExpand, onDelete, onMove, onDragOver,
}: {
  note: RoomNote; depth: number; activeFolderId: string | null; activeTabId: string | null;
  expandedIds: Set<string>; isAdmin: boolean; dragOverId: string | null;
  onSelect: (n: RoomNote) => void; onFolderSelect: (n: RoomNote) => void;
  onToggleExpand: (id: string) => void; onDelete: (id: string) => void;
  onMove: (noteId: string, parentId: string | null) => void;
  onDragOver: (id: string | null) => void;
}) {
  const isFolder = note.type === "FOLDER";
  const isExpanded = expandedIds.has(note.id);
  const isActive = activeTabId === note.id || activeFolderId === note.id;
  const isDragOver = dragOverId === note.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center h-[22px] cursor-pointer select-none text-[13px] group transition-colors",
          isActive && "bg-[#37373d] text-white",
          !isActive && "text-[#cccccc] hover:bg-[#2a2d2e]",
          isDragOver && "bg-[#094771]"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: "8px" }}
        onClick={() => {
          if (isFolder) { onToggleExpand(note.id); onFolderSelect(note); }
          else onSelect(note);
        }}
        draggable={isAdmin}
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", note.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragOver={(e) => { e.preventDefault(); if (isFolder) onDragOver(note.id); }}
        onDragLeave={() => onDragOver(null)}
        onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id !== note.id) onMove(id, isFolder ? note.id : note.parentId || null); onDragOver(null); }}
      >
        {isFolder ? (
          <ChevronRight size={16} className={cn("shrink-0 -ml-1 transition-transform text-[#858585]", isExpanded && "rotate-90")} />
        ) : (
          <span className="w-4 shrink-0 -ml-1" />
        )}
        <span className="mr-1.5 shrink-0">{isFolder ? (isExpanded ? <FolderOpen size={14} className="text-[#dcb67a]" /> : <Folder size={14} className="text-[#dcb67a]" />) : getFileIcon(note.title, 14)}</span>
        <span className="truncate flex-1">{note.title}</span>
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${note.title}"?`)) onDelete(note.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white transition-opacity"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      {isFolder && isExpanded && note.children?.map((child) => (
        <ExplorerItem key={child.id} note={child} depth={depth + 1} activeFolderId={activeFolderId}
          activeTabId={activeTabId} expandedIds={expandedIds} isAdmin={isAdmin} dragOverId={dragOverId}
          onSelect={onSelect} onFolderSelect={onFolderSelect} onToggleExpand={onToggleExpand}
          onDelete={onDelete} onMove={onMove} onDragOver={onDragOver} />
      ))}
    </div>
  );
}

/* ─── Editor ─── */
function EditorView({ note, roomId, isAdmin, onSave, onClose, isModified }: {
  note: RoomNote; roomId: string; isAdmin: boolean;
  onSave: (c: string) => void; onClose: () => void; isModified: boolean;
}) {
  const [content, setContent] = useState(note.content || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  useEffect(() => { setContent(note.content || ""); }, [note.id, note.content]);

  const lineCount = content.split("\n").length;
  const lang = getLanguageFromFileName(note.title);
  const canRun = ["javascript", "js", "typescript", "ts", "html", "htm", "python", "py"].includes(lang);
  const isIpynb = note.title.endsWith(".ipynb");

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = e.currentTarget.selectionStart, end = e.currentTarget.selectionEnd;
      setContent(content.substring(0, s) + "  " + content.substring(end));
      setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2; }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); onSave(content); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateCursor(e.target);
  };

  const updateCursor = (ta: HTMLTextAreaElement) => {
    const pos = ta.selectionStart;
    const lines = ta.value.substring(0, pos).split("\n");
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
      {/* Tab bar */}
      <div className="flex items-center h-[35px] bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center h-full bg-[#1e1e1e] border-r border-[#3c3c3c] px-3 gap-2 group">
          <span className="text-[12px] text-[#cccccc]">{note.title}</span>
          {isModified && <span className="text-[#e8e8e8] text-[10px]">●</span>}
          <button onClick={onClose} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-white transition-all">
            <X size={12} />
          </button>
        </div>
        <div className="flex-1" />
        {isAdmin && !isIpynb && (
          <div className="flex items-center gap-1 pr-2">
            <button onClick={() => onSave(content)} disabled={!isModified}
              className={cn("flex items-center gap-1 px-2 py-1 rounded text-[12px] transition-colors",
                isModified ? "text-white hover:bg-[#3c3c3c]" : "text-[#858585]")}>
              <Save size={13} /> Save
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center h-[22px] px-4 bg-[#1e1e1e] border-b border-[#3c3c3c] text-[11px] text-[#858585]">
        <span className="text-[#cccccc]">{note.title}</span>
        <span className="mx-1.5">›</span>
        <span>{lang}</span>
      </div>

      {isIpynb ? (
        <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e]">
          <JupyterNotebook initialContent={content} />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Line numbers */}
          <div ref={lineNumbersRef} className="w-[60px] shrink-0 bg-[#1e1e1e] border-r border-[#3c3c3c] overflow-hidden select-none text-right pr-2 pt-2"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", fontSize: "13px", lineHeight: "20px" }}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className={cn("pr-2", i + 1 === cursorLine ? "text-[#c6c6c6]" : "text-[#858585]")}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code area */}
          <div className="flex-1 relative">
            {isAdmin ? (
              <textarea
                ref={textareaRef}
                className="absolute inset-0 w-full h-full bg-transparent text-[#d4d4d4] p-2 resize-none focus:outline-none overflow-auto caret-white"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", fontSize: "13px", lineHeight: "20px", tabSize: 2, whiteSpace: "pre" }}
                value={content}
                onChange={handleInput}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                onClick={(e) => updateCursor(e.currentTarget)}
                onKeyUp={(e) => updateCursor(e.currentTarget)}
                spellCheck={false}
              />
            ) : (
              <pre className="absolute inset-0 w-full h-full p-2 overflow-auto text-[#d4d4d4]"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", fontSize: "13px", lineHeight: "20px", tabSize: 2, whiteSpace: "pre" }}>
                {content || "Empty file"}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Code runner */}
      {canRun && !isIpynb && (
        <div className="border-t border-[#3c3c3c]">
          <CodeRunner code={content} language={lang} fileName={note.title} />
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between h-[22px] px-3 bg-[#007acc] text-white text-[11px] select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><GitBranch size={12} /> main</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>{lang}</span>
          {!isAdmin && <span className="bg-[#c24038] px-1.5 rounded text-[10px] font-medium">READ ONLY</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function CodeEditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const roomId = searchParams.get("room");

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await api.get<CoLearningRoomFull>(`/rooms/${roomId}`)).data,
    enabled: !!roomId,
  });

  const isAdmin = room?.creator.id === user?.id;

  const [selectedNote, setSelectedNote] = useState<RoomNote | null>(null);
  const [activeFolder, setActiveFolder] = useState<RoomNote | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activePanel, setActivePanel] = useState("explorer");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["roomNotes", roomId],
    queryFn: async () => (await api.get<{ notes: RoomNote[] }>(`/rooms/${roomId}/notes`)).data,
    enabled: !!roomId,
  });

  const createNote = useMutation({
    mutationFn: async (input: { title: string; type: string; fileType?: string; parentId?: string | null }) =>
      (await api.post(`/rooms/${roomId}/notes`, input)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }); setNewFolderName(""); setShowNewFolder(false); setNewFileName(""); setShowNewFile(false); },
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, parentId }: { file: File; parentId?: string | null }) => {
      const fd = new FormData(); fd.append("file", file); fd.append("title", file.name);
      if (parentId) fd.append("parentId", parentId);
      return (await api.post(`/rooms/${roomId}/notes/upload`, fd)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => (await api.put(`/rooms/${roomId}/notes/${id}`, { content })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }); setOpenTabs((prev) => prev.map((t) => ({ ...t, modified: false }))); },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/rooms/${roomId}/notes/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }); setSelectedNote(null); setOpenTabs([]); setActiveTabId(null); },
  });

  const moveNote = useMutation({
    mutationFn: async ({ id, parentId }: { id: string; parentId: string | null }) => (await api.put(`/rooms/${roomId}/notes/${id}`, { parentId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roomNotes", roomId] }),
  });

  const notes = data?.notes ?? [];

  const buildTree = (items: RoomNote[], parentId: string | null = null): RoomNote[] =>
    items.filter((n) => n.parentId === parentId)
      .sort((a, b) => { if (a.type === "FOLDER" && b.type !== "FOLDER") return -1; if (a.type !== "FOLDER" && b.type === "FOLDER") return 1; return a.title.localeCompare(b.title); })
      .map((note) => ({ ...note, children: items.filter((n) => n.parentId === note.id).length > 0 ? buildTree(items, note.id) : undefined }));

  const tree = buildTree(notes);

  useEffect(() => { if (tree.length > 0) setExpandedIds(new Set(tree.filter((n) => n.type === "FOLDER").map((n) => n.id))); }, [data]);

  const toggleExpand = useCallback((id: string) => { setExpandedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }, []);

  const openNote = useCallback((note: RoomNote) => {
    if (note.type === "FOLDER") return;
    setSelectedNote(note); setActiveTabId(note.id); setActivePanel("explorer");
    if (!openTabs.find((t) => t.noteId === note.id)) setOpenTabs((prev) => [...prev, { noteId: note.id, modified: false }]);
  }, [openTabs]);

  const closeTab = useCallback((noteId: string) => {
    const tab = openTabs.find((t) => t.noteId === noteId);
    if (tab?.modified && !confirm("Discard unsaved changes?")) return;
    setOpenTabs((prev) => prev.filter((t) => t.noteId !== noteId));
    if (activeTabId === noteId) {
      const remaining = openTabs.filter((t) => t.noteId !== noteId);
      if (remaining.length > 0) { const last = remaining[remaining.length - 1]; setActiveTabId(last.noteId); setSelectedNote(notes.find((n) => n.id === last.noteId) || null); }
      else { setActiveTabId(null); setSelectedNote(null); }
    }
  }, [openTabs, activeTabId, notes]);

  const handleSave = useCallback((content: string) => { if (!activeTabId || !isAdmin) return; updateNote.mutate({ id: activeTabId, content }); }, [activeTabId, isAdmin, updateNote]);

  const handleCreateFolder = () => { if (!newFolderName.trim()) return; createNote.mutate({ title: newFolderName, type: "FOLDER", parentId: activeFolder?.id || null }); };
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split(".").pop()?.toLowerCase() || "";
    const codeExts = ["js","jsx","ts","tsx","py","ipynb","rb","go","rs","java","c","cpp","cs","h","hpp","sh","bash","php","dart","swift","kt","scala","r","lua","pl","sql","html","htm","css","scss","less","json","yaml","yml","toml","xml","md","csv","graphql","vue","svelte","astro"];
    createNote.mutate({ title: newFileName, type: "FILE", fileType: codeExts.includes(ext) ? "CODE" : "TEXT", parentId: activeFolder?.id || null });
  };
  const handleUpload = () => { const input = document.createElement("input"); input.type = "file"; input.multiple = true; input.onchange = (e: any) => { const files = e.target.files as FileList; Array.from(files).forEach((f: File) => uploadFile.mutate({ file: f, parentId: activeFolder?.id || null })); }; input.click(); };
  const handleMove = useCallback((noteId: string, targetParentId: string | null) => {
    if (noteId === targetParentId) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.parentId === targetParentId) return;
    moveNote.mutate({ id: noteId, parentId: targetParentId });
  }, [notes, moveNote]);

  const handlePanelToggle = (panel: string) => {
    setActivePanel((prev) => (prev === panel ? "" : panel));
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e1e] text-[#858585]">
        <Code2 size={64} className="mb-6 text-[#007acc] opacity-50" />
        <p className="text-lg text-[#cccccc] mb-2">No room selected</p>
        <p className="text-sm mb-6">Click "Notes" in a Co-Learning Room to open its Code Editor</p>
        <button onClick={() => navigate("/rooms")} className="flex items-center gap-2 px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005fa3] transition-colors text-sm">
          <ArrowLeft size={14} /> Go to Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] select-none">
      {/* Title bar */}
      <div className="flex items-center h-[30px] bg-[#3c3c3c] border-b border-[#3c3c3c] px-2 text-[12px] text-[#999999]">
        <button onClick={() => navigate(`/rooms/${roomId}`)} className="p-1 hover:bg-[#505050] rounded mr-2 text-[#cccccc]" title="Back to room">
          <ArrowLeft size={14} />
        </button>
        <span className="text-[#cccccc] font-medium">{room?.name || "..."}</span>
        <span className="mx-1.5">—</span>
        <span>Code Editor</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[11px]">
          <span>{notes.length} files</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Activity bar */}
        <ActivityBar activePanel={activePanel} onToggle={handlePanelToggle} />

        {/* Sidebar */}
        {activePanel === "explorer" && (
          <div className="w-[240px] shrink-0 border-r border-[#3c3c3c]">
            <FileExplorer
              tree={tree} activeFolderId={activeFolder?.id || null} activeTabId={activeTabId}
              expandedIds={expandedIds} isAdmin={!!isAdmin} dragOverId={dragOverId}
              onSelect={openNote} onFolderSelect={(n) => setActiveFolder(n)}
              onToggleExpand={toggleExpand} onDelete={(id) => { if (confirm("Delete?")) deleteNote.mutate(id); }}
              onMove={handleMove} onDragOver={setDragOverId}
              onCreateFolder={() => setShowNewFolder(true)} onCreateFile={() => setShowNewFile(true)} onUpload={handleUpload}
            />
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedNote ? (
            <EditorView key={selectedNote.id} note={selectedNote} roomId={roomId!} isAdmin={!!isAdmin}
              onSave={handleSave} onClose={() => closeTab(selectedNote.id)}
              isModified={openTabs.find((t) => t.noteId === selectedNote.id)?.modified || false} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
              <div className="text-center">
                <Code2 size={64} className="mx-auto mb-4 text-[#3c3c3c]" />
                <p className="text-[#858585] text-sm">Select a file to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewFolder(false)}>
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm text-[#cccccc] mb-3">New Folder</h3>
            <input className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={activeFolder ? `Inside ${activeFolder.title}` : "Root"} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setShowNewFolder(false); }} />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowNewFolder(false)} className="px-3 py-1 text-sm text-[#cccccc] hover:bg-[#3c3c3c] rounded">Cancel</button>
              <button onClick={handleCreateFolder} className="px-3 py-1 text-sm bg-[#007acc] text-white rounded hover:bg-[#005fa3]">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewFile(false)}>
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm text-[#cccccc] mb-3">New File</h3>
            <input className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-1.5 text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              value={newFileName} onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. index.js" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFile(); if (e.key === "Escape") setShowNewFile(false); }} />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowNewFile(false)} className="px-3 py-1 text-sm text-[#cccccc] hover:bg-[#3c3c3c] rounded">Cancel</button>
              <button onClick={handleCreateFile} className="px-3 py-1 text-sm bg-[#007acc] text-white rounded hover:bg-[#005fa3]">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
