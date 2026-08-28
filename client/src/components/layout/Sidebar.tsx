import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  Search,
  Settings,
  SquareKanban,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { LogoMark } from "../ui/LogoMark";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/board", label: "Task Board", icon: SquareKanban },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/rooms", label: "Co-Learning", icon: Users },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/search", label: "Find Devs", icon: Search },
] as const;

const SIDEBAR_ROUTES: Record<string, string[]> = {
  "/board": ["/board", "/tasks"],
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/70 bg-[#0B1120]/95 backdrop-blur",
          "transition-transform duration-300 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/70 px-5">
          <NavLink to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <LogoMark size={32} />
            <span className="font-mono text-lg font-bold tracking-tight text-white">
              dev<span className="text-gradient-neon">task</span>
            </span>
          </NavLink>
          <button
            className="rounded-lg p-1.5 text-ink-muted hover:bg-white/5 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => {
            const routes = SIDEBAR_ROUTES[to] ?? [to];
            const isActive = routes.some((r) => location.pathname === r || location.pathname.startsWith(r + "/"));
            return (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest ? rest.end : false}
              onClick={onClose}
              className={() =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-white"
                    : "text-ink-muted hover:bg-white/5 hover:text-slate-100"
                )
              }
            >
                <>
                  {/* Glowing cyan active indicator */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-neon-gradient transition-all",
                      isActive ? "shadow-glow opacity-100" : "opacity-0"
                    )}
                  />
                  <Icon
                    size={18}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-accent-bright drop-shadow-[0_0_6px_rgb(var(--accent-rgb)/0.8)]" : ""
                    )}
                  />
                  <span>{label}</span>
                </>
            </NavLink>
            );
          })}
        </nav>

        {/* Bottom: Profile + Settings */}
        <nav className="mt-auto space-y-1 border-t border-slate-800/70 px-3 py-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-white"
                  : "text-ink-muted hover:bg-white/5 hover:text-slate-100"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-neon-gradient transition-all",
                    isActive ? "shadow-glow opacity-100" : "opacity-0"
                  )}
                />
                <UserRound
                  size={18}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent-bright drop-shadow-[0_0_6px_rgb(var(--accent-rgb)/0.8)]" : ""
                  )}
                />
                <span>Profile</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-white"
                  : "text-ink-muted hover:bg-white/5 hover:text-slate-100"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-neon-gradient transition-all",
                    isActive ? "shadow-glow opacity-100" : "opacity-0"
                  )}
                />
                <Settings
                  size={18}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent-bright drop-shadow-[0_0_6px_rgb(var(--accent-rgb)/0.8)]" : ""
                  )}
                />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* Profile mini-card */}
        <div className="border-t border-slate-800/70 px-4 pb-3 pt-2">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5",
                isActive && "bg-white/5"
              )
            }
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-slate-950"
              style={{
                background: `linear-gradient(135deg, ${user?.avatarColor ?? "#06B6D4"}, rgb(var(--accent-2-rgb)))`,
                boxShadow: `0 0 14px ${(user?.avatarColor ?? "#06B6D4") + "55"}`,
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                (user?.name ?? "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-200">
                {user?.name ?? "…"}
              </span>
              <span className="block truncate text-[11px] font-mono text-accent-bright/80">
                @{user?.username ?? "user"}
              </span>
            </span>
          </NavLink>
          <p className="mt-2 px-3 font-mono text-[10px] uppercase tracking-widest text-slate-600">
            DevTask v2.0
          </p>
        </div>
      </aside>
    </>
  );
}
