import React from 'react';
import { LayoutDashboard, KanbanSquare, GraduationCap, LogOut, Settings, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Working Space', icon: KanbanSquare, id: 'tasks' },
    { name: 'Roadmaps & Courses', icon: GraduationCap, id: 'courses' },
    { name: 'Developer Profile', icon: User, id: 'profile' },
    { name: 'Settings', icon: Settings, id: 'settings' }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-darkBg border-r border-slate-200 dark:border-darkBorder flex flex-col h-screen select-none z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Logo & Mobile Close */}
        <div className="p-6 border-b border-slate-200 dark:border-darkBorder flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/devtask-logo.png"
              alt="DevTask logo"
              className="w-10 h-10 rounded-lg object-cover neon-glow-cyan"
            />
            <div>
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-textHeader tracking-wider">DevTask</span>
              <p className="text-[10px] text-neonCyan font-mono tracking-widest font-semibold uppercase">Workspace v1.0</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-darkHover text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false); // Close on click for mobile
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group ${
                  isActive
                    ? 'bg-slate-100 dark:bg-darkHover text-slate-900 dark:text-textHeader border-l-4 border-neonCyan pl-3'
                    : 'text-slate-600 dark:text-textMuted hover:bg-slate-50 dark:hover:bg-darkHover/50 hover:text-slate-900 dark:hover:text-textHeader'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? 'text-neonCyan scale-105' : 'text-slate-400 dark:text-slate-500 group-hover:text-neonCyan'
                }`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User Session Profile Indicator */}
        {user && (
          <div className="p-4 border-t border-slate-200 dark:border-darkBorder bg-slate-50/50 dark:bg-darkInput/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-neonCyan/40 neon-glow-cyan"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-darkBorder flex items-center justify-center border border-neonCyan/40 neon-glow-cyan text-neonCyan font-mono font-bold text-lg uppercase">
                    {user.name?.charAt(0) || 'D'}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-neonTeal border-2 border-slate-200 dark:border-darkBg" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-textHeader truncate">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-textMuted truncate font-mono">{user.title}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-100 dark:bg-darkHover text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200 border border-slate-200 dark:border-darkBorder text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout Session
            </button>
          </div>
        )}
      </div>
    </>
  );
}
