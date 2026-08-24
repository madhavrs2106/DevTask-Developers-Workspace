import { useState } from "react";
import { useAddDiscussion } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import type { CoLearningRoomFull } from "../../types";

interface Props {
  room: CoLearningRoomFull;
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
    <div>
      <h2 className="font-semibold text-[var(--text-primary)] mb-4">Discussions & Doubts</h2>

      <form onSubmit={handlePost} className="mb-6 space-y-3">
        {room.syllabusItems.length > 0 && (
          <select
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
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
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] h-20 resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
          {room.discussions.map((post) => (
            <div key={post.id} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: post.author.avatarColor }}
                >
                  {post.author.username[0].toUpperCase()}
                </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
