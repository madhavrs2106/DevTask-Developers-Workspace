import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Flame } from 'lucide-react';

export default function Header({ currentPageName, setSidebarOpen }) {
  const { user } = useAuth();
  const streak = user?.streak || 0;

  return (
    <header className="h-20 bg-white dark:bg-darkSurface border-b border-slate-200 dark:border-darkBorder flex items-center justify-between px-4 md:px-8 relative z-10">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-600 dark:text-textMuted hover:text-neonCyan transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm md:text-xl font-bold text-slate-900 dark:text-textHeader tracking-wide font-mono">
            {currentPageName}
          </h1>
          <p className="hidden md:block text-[10px] md:text-xs text-slate-500 dark:text-textMuted mt-0.5">Automated Developer Workflow Suite</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Streak counter */}
        <div
          title={`${streak} consecutive study day${streak === 1 ? '' : 's'}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-xs font-bold transition-all ${
            streak > 0
              ? 'bg-orange-500/10 border-orange-500/25 text-orange-500 dark:text-orange-400'
              : 'bg-slate-100 dark:bg-darkHover border-slate-200 dark:border-darkBorder text-slate-400 dark:text-textMuted'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{streak}</span>
          <span className="hidden sm:inline">day{streak === 1 ? '' : 's'}</span>
        </div>

        {user && (
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder rounded-full pl-3 pr-4 py-1.5">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neonCyan/20 flex items-center justify-center text-neonCyan font-bold text-xs uppercase font-mono">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-textHeader font-mono">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
