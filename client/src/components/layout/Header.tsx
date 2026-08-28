import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Plus, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

const TITLES: { match: RegExp; title: string; subtitle: string }[] = [
  { match: /^\/$/, title: "Dashboard", subtitle: "Your developer pulse at a glance" },
  { match: /^\/board/, title: "Task Board", subtitle: "Drag & drop your workflow" },
  { match: /^\/tasks/, title: "All Tasks", subtitle: "Everything on your plate" },
  { match: /^\/projects/, title: "Projects", subtitle: "What you're building" },
  { match: /^\/courses/, title: "Courses & Roadmaps", subtitle: "Level up, one lesson at a time" },
  { match: /^\/resume/, title: "Resume Generator", subtitle: "Auto-build an ATS-friendly resume" },
  { match: /^\/settings/, title: "Profile Settings", subtitle: "Tune your workspace" },
];

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta =
    TITLES.find((t) => t.match.test(location.pathname)) ??
    TITLES[TITLES.length - 1];

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-midnight/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-white sm:text-lg">{meta.title}</h1>
          <p className="hidden truncate text-xs text-ink-faint sm:block">{meta.subtitle}</p>
        </div>

        <Link
          to="/board?new=1"
          className="hidden items-center gap-2 rounded-xl bg-neon-gradient px-4 py-2 text-xs font-semibold text-slate-950 shadow-glow-sm transition-all hover:brightness-110 sm:inline-flex"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Task
        </Link>

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-white/5",
              menuOpen && "bg-white/5"
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold text-slate-950 ring-2 ring-accent/40"
              style={{
                background: `linear-gradient(135deg, ${user?.avatarColor ?? "#06B6D4"}, rgb(var(--accent-2-rgb)))`,
                boxShadow: `0 0 12px ${(user?.avatarColor ?? "#06B6D4") + "66"}`,
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
            <span className="hidden max-w-[120px] truncate font-mono text-xs text-slate-300 md:block">
              {user?.name}
            </span>
            <ChevronDown size={14} className={cn("text-ink-faint transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="card absolute right-0 mt-2 w-52 overflow-hidden p-1.5 animate-scale-in"
            >
              <div className="border-b border-slate-800 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate font-mono text-[11px] text-ink-faint">{user?.email}</p>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Settings size={15} /> Profile settings
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-400/10"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
