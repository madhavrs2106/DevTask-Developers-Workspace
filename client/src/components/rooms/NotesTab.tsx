import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { CoLearningRoomFull, RoomNote } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

const qk = {
  notes: (roomId: string) => ["roomNotes", roomId],
};

function getIcon(note: RoomNote, isOpen?: boolean) {
  if (note.type === "FOLDER") {
    return isOpen ? (
      <FolderOpen size={16} className="text-yellow-400" />
    ) : (
      <Folder size={16} className="text-yellow-400" />
    );
  }
  switch (note.fileType) {
    case "CODE":
      return <Code2 size={16} className="text-green-400" />;
    case "IMAGE":
      return <Image size={16} className="text-pink-400" />;
    case "VIDEO":
      return <Video size={16} className="text-purple-400" />;
    case "TEXT":
      return <FileText size={16} className="text-blue-400" />;
    default:
      return <File size={16} className="text-[var(--text-secondary)]" />;
  }
}

function TreeItem({
  note,
  depth,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
}: {
  note: RoomNote;
  depth: number;
  selectedId: string | null;
  onSelect: (note: RoomNote) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(note.id);
  const isSelected = selectedId === note.id;
  const hasChildren = note.type === "FOLDER" && note.children && note.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (note.type === "FOLDER") onToggleExpand(note.id);
          onSelect(note);
        }}
        className={cn(
          "flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left rounded-lg transition-colors",
          isSelected
            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
            : "text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {note.type === "FOLDER" ? (
          isExpanded ? (
            <ChevronDown size={14} className="shrink-0 text-[var(--text-secondary)]" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-[var(--text-secondary)]" />
          )
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        {getIcon(note, isExpanded)}
        <span className="truncate">{note.title}</span>
      </button>
      {isExpanded && hasChildren && (
        <div>
          {note.children!.map((child) => (
            <TreeItem
              key={child.id}
              note={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentViewer({
  note,
  roomId,
  onClose,
}: {
  note: RoomNote;
  roomId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content || "");
  const [editTitle, setEditTitle] = useState(note.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateNote = useMutation({
    mutationFn: async (data: { title?: string; content?: string }) =>
      (await api.put(`/rooms/${roomId}/notes/${note.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notes(roomId) });
      setEditing(false);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async () =>
      (await api.delete(`/rooms/${roomId}/notes/${note.id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notes(roomId) });
      onClose();
    },
  });

  useEffect(() => {
    setEditContent(note.content || "");
    setEditTitle(note.title);
    setEditing(false);
  }, [note.id]);

  const handleSave = () => {
    updateNote.mutate({ title: editTitle, content: editContent });
  };

  const renderContent = () => {
    if (note.type === "FOLDER") {
      return (
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
          <div className="text-center">
            <Folder size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a file to view its content</p>
          </div>
        </div>
      );
    }

    if (editing) {
      return (
        <div className="flex-1 flex flex-col p-4">
          <input
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm mb-3 focus:outline-none focus:border-[var(--accent)]"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <textarea
            ref={textareaRef}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] text-sm font-mono resize-none focus:outline-none focus:border-[var(--accent)]"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={handleSave} disabled={updateNote.isPending} className="gap-1.5">
              <Check size={14} />
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} className="gap-1.5">
              <X size={14} />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    switch (note.fileType) {
      case "VIDEO":
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <video controls className="max-w-full max-h-[60vh] rounded-lg">
              <source src={note.content || ""} />
              Your browser does not support video playback.
            </video>
          </div>
        );
      case "IMAGE":
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={note.content || ""} alt={note.title} className="max-w-full max-h-[60vh] rounded-lg" />
          </div>
        );
      case "CODE":
      case "TEXT":
        return (
          <div className="flex-1 flex flex-col p-4">
            <pre className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 overflow-auto text-sm text-[var(--text-primary)] font-mono whitespace-pre-wrap">
              {note.content || "Empty file"}
            </pre>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <a
              href={note.content || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              Open file
            </a>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          {getIcon(note)}
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {note.title}
          </span>
          {note.fileType && (
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-0.5 rounded">
              {note.fileType}
            </span>
          )}
          {note.fileSize && (
            <span className="text-xs text-[var(--text-secondary)]">
              {(note.fileSize / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {note.type === "FILE" && (note.fileType === "TEXT" || note.fileType === "CODE") && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
            >
              <Edit3 size={14} />
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Delete this note?")) deleteNote.mutate();
            }}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}

export function NotesTab({ room }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedNote, setSelectedNote] = useState<RoomNote | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: qk.notes(room.id),
    queryFn: async () => (await api.get<{ notes: RoomNote[] }>(`/rooms/${room.id}/notes`)).data,
  });

  const createNote = useMutation({
    mutationFn: async (input: { title: string; type: string; parentId?: string | null }) =>
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

  const notes = data?.notes ?? [];

  // Build tree
  const buildTree = (items: RoomNote[], parentId: string | null = null): RoomNote[] => {
    return items
      .filter((n) => (parentId === null ? !n.parentId : n.parentId === parentId))
      .map((n) => ({
        ...n,
        children: n.type === "FOLDER" ? buildTree(items, n.id) : undefined,
      }));
  };

  const tree = buildTree(notes);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createNote.mutate({
      title: newFolderName.trim(),
      type: "FOLDER",
      parentId: parentId || undefined,
    });
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    createNote.mutate({
      title: newFileName.trim(),
      type: "FILE",
      parentId: parentId || undefined,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile.mutate(file);
      e.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Notes & Lectures</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => { setShowNewFolder(true); setShowNewFile(false); }} className="text-sm gap-1.5">
            <Folder size={14} />
            New Folder
          </Button>
          <Button variant="ghost" onClick={() => { setShowNewFile(true); setShowNewFolder(false); }} className="text-sm gap-1.5">
            <FileText size={14} />
            New File
          </Button>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="text-sm gap-1.5">
            <Upload size={14} />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="video/*,image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.md,.txt,.csv,.rtf,.js,.ts,.jsx,.tsx,.py,.java,.html,.css,.json,.c,.cpp,.cs,.go,.rs,.sh,.rb,.php,.sql,.yaml,.yml,.xml,.toml,.dart,.swift,.kt,.scala,.r,.lua,.pl,.zip,.tar,.gz,.7z,.rar"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* New Folder Form */}
      {showNewFolder && (
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name (e.g., Lecture 1)"
            autoFocus
          />
          <Button variant="primary" onClick={handleCreateFolder} disabled={createNote.isPending} className="text-sm">
            Create
          </Button>
          <Button variant="ghost" onClick={() => setShowNewFolder(false)} className="text-sm">
            Cancel
          </Button>
        </div>
      )}

      {/* New File Form */}
      {showNewFile && (
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="File name (e.g., notes.txt)"
            autoFocus
          />
          <Button variant="primary" onClick={handleCreateFile} disabled={createNote.isPending} className="text-sm">
            Create
          </Button>
          <Button variant="ghost" onClick={() => setShowNewFile(false)} className="text-sm">
            Cancel
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0 border border-[var(--border)] rounded-xl overflow-hidden">
        {/* Tree sidebar */}
        <div className="w-64 shrink-0 border-r border-[var(--border)] overflow-y-auto bg-[var(--bg-card)]">
          {tree.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
              <Folder size={24} className="mx-auto mb-2 opacity-30" />
              No notes yet
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {tree.map((note) => (
                <TreeItem
                  key={note.id}
                  note={note}
                  depth={0}
                  selectedId={selectedNote?.id ?? null}
                  onSelect={setSelectedNote}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content viewer */}
        {selectedNote ? (
          <ContentViewer
            note={selectedNote}
            roomId={room.id}
            onClose={() => setSelectedNote(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a file from the tree to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
