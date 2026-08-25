import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Save, Edit3, Eye, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface NotesTabProps {
  roomId: string;
  roomNotes: string | null;
  isAdmin: boolean;
  onSave: (notes: string) => void;
  isSaving: boolean;
}

export function NotesTab({ roomId, roomNotes, isAdmin, onSave, isSaving }: NotesTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(roomNotes || "");

  useEffect(() => {
    setContent(roomNotes || "");
  }, [roomNotes]);

  const handleSave = () => {
    onSave(content);
    setIsEditing(false);
  };

  const hasContent = content.trim().length > 0;

  if (!isAdmin && !hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
        <Edit3 size={40} className="mb-3 opacity-30" />
        <p className="text-sm">No notes yet</p>
        <p className="text-xs mt-1 opacity-60">The admin hasn't added any notes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
                  !isEditing ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                )}
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
                  isEditing ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                )}
              >
                <Edit3 size={14} /> Edit
              </button>
            </>
          )}
        </div>

        {isAdmin && isEditing && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="flex items-center gap-1.5"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </Button>
        )}
      </div>

      {/* Editor */}
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[400px] p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-mono text-sm leading-relaxed focus:outline-none focus:border-[var(--accent)] resize-y"
          placeholder="Write your notes in markdown...

# Heading
## Subheading

- List item
- Another item

**Bold text** and *italic text*

```python
print('code block')
```

> Blockquote

[Link text](https://example.com)"
          spellCheck={false}
        />
      ) : (
        <div className="min-h-[400px] p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
          {hasContent ? (
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-[var(--text-primary)] prose-headings:font-bold
              prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
              prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
              prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
              prose-p:text-[var(--text-primary)] prose-p:leading-relaxed
              prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[var(--text-primary)]
              prose-code:text-[var(--accent)] prose-code:bg-[var(--bg-secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-[var(--bg-secondary)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:rounded-xl prose-pre:p-4
              prose-li:text-[var(--text-primary)]
              prose-blockquote:border-l-[var(--accent)] prose-blockquote:text-[var(--text-secondary)] prose-blockquote:italic
              prose-hr:border-[var(--border)]
              prose-th:text-[var(--text-primary)] prose-td:text-[var(--text-primary)]
              prose-th:border-[var(--border)] prose-td:border-[var(--border)]"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
              <Edit3 size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No notes yet</p>
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-3 text-sm text-[var(--accent)] hover:underline"
                >
                  Add notes
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Markdown help */}
      {isEditing && (
        <div className="text-xs text-[var(--text-secondary)] opacity-60 space-y-1">
          <p className="font-semibold">Markdown shortcuts:</p>
          <p># Heading | ## Subheading | **bold** | *italic* | `code` | - list | 1. ordered | &gt; quote | [link](url) | ![alt](image)</p>
        </div>
      )}
    </div>
  );
}
