import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Search, UserPlus, UserMinus, Users, UserCheck } from "lucide-react";
import { useFollowList, useFollowUser, useUnfollowUser } from "../hooks/useQueries";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { cn, initials } from "../lib/utils";

export function FollowList() {
  const { username, type } = useParams<{ username: string; type: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");

  const listType = type === "following" ? "following" : "followers";
  const { data: users, isLoading } = useFollowList(username, listType);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition-all hover:border-accent/50 hover:text-accent-bright hover:bg-accent/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-white">
            <Users size={20} className="text-accent-bright" />
            {listType === "followers" ? "Followers" : "Following"}
          </h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            <Link
              to={`/u/${username}`}
              className="font-medium text-accent-bright/70 hover:text-accent-bright transition-colors"
            >
              @{username}
            </Link>
            {" · "}
            {(users ?? []).length} developer{(users ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      {(users ?? []).length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-ink-faint transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none"
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading list..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            search
              ? "No users match your search"
              : listType === "followers"
                ? "No followers yet"
                : "Not following anyone yet"
          }
          hint={
            search
              ? "Try a different search term."
              : listType === "followers"
                ? "When other developers follow you, they'll appear here."
                : "When you follow other developers, they'll appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="card group flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:border-slate-700 hover:shadow-glow-sm"
            >
              {/* Avatar */}
              <Link to={`/u/${u.username}`} className="shrink-0">
                <div
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full font-mono text-sm font-bold text-slate-950 transition-transform group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}88)`,
                    boxShadow: `0 0 20px ${u.avatarColor}33`,
                  }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(u.name)
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/u/${u.username}`}
                  className="block truncate text-sm font-semibold text-white hover:text-accent-bright transition-colors"
                >
                  {u.name}
                </Link>
                <p className="truncate text-[11px] text-ink-faint">
                  @{u.username}
                  {u.role && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-accent-bright">
                      {u.role === "DEVELOPER" ? "Dev" : "Learner"}
                    </span>
                  )}
                </p>
              </div>

              {/* Follow button */}
              {u.id !== currentUser?.id && (
                <Button
                  size="sm"
                  variant={u.isFollowing ? "outline" : "primary"}
                  onClick={() =>
                    u.isFollowing
                      ? unfollowMutation.mutate(u.username)
                      : followMutation.mutate(u.username)
                  }
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={cn(
                    "shrink-0 gap-1.5",
                    u.isFollowing && "hover:border-rose-400/50 hover:text-rose-400 hover:bg-rose-400/5"
                  )}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : u.isFollowing ? (
                    <UserMinus size={13} />
                  ) : (
                    <UserPlus size={13} />
                  )}
                  {u.isFollowing ? "Following" : "Follow"}
                </Button>
              )}

              {/* Own user badge */}
              {u.id === currentUser?.id && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent-bright">
                  <UserCheck size={11} />
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
