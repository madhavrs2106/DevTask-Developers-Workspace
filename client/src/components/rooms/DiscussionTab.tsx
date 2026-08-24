import { useState } from "react";
import {
  MessageSquare,
  Reply,
  Tag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAddDiscussion } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
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
    <form onSubmit={handlePost} className="mt-3 flex gap-2">
      <input
        className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        autoFocus
      />
      <Button
        variant="primary"
        type="submit"
        disabled={!content.trim() || addDiscussion.isPending}
        className="text-xs gap-1.5"
      >
        <Reply size={12} />
        Reply
      </Button>
      <Button variant="ghost" type="button" onClick={onCancel} className="text-xs">
        Cancel
      </Button>
    </form>
  );
}

function DiscussionPost({
  post,
  roomId,
  depth = 0,
}: {
  post: RoomDiscussion;
  roomId: string;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = post.replies && post.replies.length > 0;

  return (
    <div className={cn(depth > 0 && "ml-6 pl-4 border-l-2 border-[var(--border)]")}>
      <div className="group p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/20 transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: post.author.avatarColor }}
          >
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              post.author.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {post.author.name}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                @{post.author.username}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          {post.syllabusItem && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs">
              <Tag size={10} />
              {post.syllabusItem.title}
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <Reply size={12} />
            Reply
          </button>
          {hasReplies && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              {post.replies!.length} repl{post.replies!.length === 1 ? "y" : "ies"}
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReply && (
        <div className="ml-6 mt-2">
          <ReplyForm
            parentId={post.id}
            roomId={roomId}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {/* Replies */}
      {hasReplies && !collapsed && (
        <div className="mt-3 space-y-3">
          {post.replies!.map((reply) => (
            <DiscussionPost key={reply.id} post={reply} roomId={roomId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DiscussionTab({ room }: Props) {
  const addDiscussion = useAddDiscussion(room.id);
  const [content, setContent] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addDiscussion.mutateAsync({
      content: content.trim(),
      itemId: selectedItemId || undefined,
    });
    setContent("");
    setSelectedItemId("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Discussions
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Ask questions, share insights, help each other
        </p>
      </div>

      {/* New Post Form */}
      <form
        onSubmit={handlePost}
        className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
      >
        {room.syllabusItems.length > 0 && (
          <select
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
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
        <textarea
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] h-24 resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Ask a question or share an insight..."
        />
        <div className="flex justify-end mt-3">
          <Button
            variant="primary"
            type="submit"
            disabled={!content.trim() || addDiscussion.isPending}
            className="gap-2"
          >
            <MessageSquare size={14} />
            {addDiscussion.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>

      {/* Posts */}
      {room.discussions.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] border-dashed">
          <MessageSquare size={40} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
          <p className="text-sm text-[var(--text-secondary)]">No discussions yet</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Start a conversation about your study topic
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {room.discussions.map((post) => (
            <DiscussionPost key={post.id} post={post} roomId={room.id} />
          ))}
        </div>
      )}
    </div>
  );
}
