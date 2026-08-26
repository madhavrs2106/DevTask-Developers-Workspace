import { useState, useRef, useCallback } from "react";
import { useAddDiscussion, useDeleteDiscussion, useMe } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import { Trash2 } from "lucide-react";
import type { CoLearningRoomFull, RoomDiscussion } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

function ReplyForm({
  parentId,
  roomId,
  onCancel,
}: {
  parentId: string;
  roomId: string;
  onCancel: () => void;
}) {
  const addDiscussion = useAddDiscussion(roomId);
  const [content, setContent] = useState("");

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addDiscussion.mutateAsync({ content: content.trim(), parentId });
    setContent("");
    onCancel();
  };

  return (
    <form onSubmit={handlePost} className="mt-2 flex gap-2">
      <input
        className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        autoFocus
      />
      <Button variant="primary" type="submit" disabled={!content.trim() || addDiscussion.isPending} className="text-xs px-3 py-1.5 shrink-0">
        Reply
      </Button>
      <Button variant="ghost" type="button" onClick={onCancel} className="text-xs px-2 py-1.5 shrink-0">
        Cancel
      </Button>
    </form>
  );
}

function DiscussionPost({
  post,
  roomId,
  currentUserId,
  depth = 0,
}: {
  post: RoomDiscussion;
  roomId: string;
  currentUserId: string;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const deleteDiscussion = useDeleteDiscussion(roomId);
  const isAuthor = post.author.id === currentUserId;

  return (
    <div className={depth > 0 ? "ml-6 pl-3 border-l-2 border-[var(--border)]" : ""}>
      <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.username}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: post.author.avatarColor }}
            >
              {post.author.username[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {post.author.username}
          </span>
          {post.syllabusItem && (
            <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
              {post.syllabusItem.title}
            </span>
          )}
          <span className="text-xs text-[var(--text-secondary)] ml-auto">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Reply
          </button>
          {isAuthor && (
            <button
              onClick={() => deleteDiscussion.mutateAsync(post.id)}
              disabled={deleteDiscussion.isPending}
              className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
            >
              <Trash2 size={11} />
              Delete
            </button>
          )}
        </div>
      </div>

      {showReply && (
        <div className="ml-6 mt-2">
          <ReplyForm parentId={post.id} roomId={roomId} onCancel={() => setShowReply(false)} />
        </div>
      )}

      {post.replies && post.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {post.replies.map((reply) => (
            <DiscussionPost key={reply.id} post={reply} roomId={roomId} currentUserId={currentUserId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DiscussionTab({ room }: Props) {
  const addDiscussion = useAddDiscussion(room.id);
  const { data: me } = useMe();
  const [content, setContent] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addDiscussion.mutateAsync({
      content: content.trim(),
      itemId: selectedItemId || undefined,
    });
    setContent("");
    setSelectedItemId("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div>
      <h2 className="font-semibold text-[var(--text-primary)] mb-4">Discussions & Doubts</h2>

      <form onSubmit={handlePost} className="mb-6 space-y-3">
        {room.syllabusItems.length > 0 && (
          <select
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          >
            <option value="">General discussion</option>
            {room.syllabusItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] min-h-[80px] max-h-48 resize-none"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoResize();
            }}
            placeholder="Ask a question, share a doubt, or discuss a concept..."
          />
        </div>
        <Button variant="primary" type="submit" disabled={!content.trim() || addDiscussion.isPending} className="text-sm">
          {addDiscussion.isPending ? "Posting..." : "Post"}
        </Button>
      </form>

      {room.discussions.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          No discussions yet. Start a conversation about your study topic.
        </p>
      ) : (
        <div className="space-y-3">
          {room.discussions
            .filter((post) => {
              if (!selectedItemId) return !post.syllabusItem;
              return post.syllabusItem?.id === selectedItemId;
            })
            .map((post) => (
            <DiscussionPost key={post.id} post={post} roomId={room.id} currentUserId={me?.id ?? ""} />
          ))}
          {room.discussions.filter((post) => {
            if (!selectedItemId) return !post.syllabusItem;
            return post.syllabusItem?.id === selectedItemId;
          }).length === 0 && (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
              No discussions for this topic yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
