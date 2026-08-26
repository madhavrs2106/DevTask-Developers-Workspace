import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Users } from "lucide-react";
import { useSearchUsers } from "../hooks/useQueries";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useMemo(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: users = [], isLoading } = useSearchUsers(debounced);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Find Developers</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Search by username or name to discover other developers.
        </p>
      </div>

      <div className="relative">
        <SearchIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or name…"
          className="input-dark w-full pl-11"
          autoFocus
        />
      </div>

      {debounced.trim().length < 2 ? (
        <>
          <EmptyState
            icon={Users}
            title="Search for developers"
            hint="Type at least 2 characters to find other developers by their username or name."
          />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Suggested accounts</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { username: "satoshi_demo", name: "Satoshi Demo", color: "#8B5CF6" },
                { username: "madhavrs_official", name: "Madhav RS", color: "#06B6D4" },
              ].map((u) => (
                <Link
                  key={u.username}
                  to={`/u/${u.username}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-surface-raised p-3 transition-colors hover:border-slate-700 hover:bg-surface-raised/80"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-950"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.name[0]}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{u.name}</span>
                    <span className="block truncate font-mono text-[11px] text-accent-bright/80">@{u.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No developers found"
          hint={`No results for "${debounced}". Try a different search.`}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ink-faint">
            {users.length} developer{users.length !== 1 && "s"} found
          </p>
          {users.map((u) => (
            <Link
              key={u.id}
              to={`/u/${u.username}`}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-surface-raised p-4 transition-colors hover:border-slate-700 hover:bg-surface-raised/80"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-slate-950"
                style={{
                  background: `linear-gradient(135deg, ${u.avatarColor}, rgb(var(--accent-2-rgb)))`,
                  boxShadow: `0 0 14px ${u.avatarColor}55`,
                }}
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  u.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                )}
              </span>

              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{u.name}</span>
                <span className="block truncate font-mono text-xs text-accent-bright/80">
                  @{u.username}
                </span>
                {u.bio && (
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">{u.bio}</span>
                )}
              </div>

              <span className="shrink-0 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium uppercase text-ink-faint">
                {u.role === "DEVELOPER" ? "Dev" : "Learner"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
