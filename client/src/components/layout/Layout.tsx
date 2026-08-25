import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isCodeEditor = location.pathname === "/code-editor";

  if (isCodeEditor) {
    return (
      <div className="min-h-screen bg-midnight">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
          <Outlet />
        </main>
        <footer className="border-t border-slate-800/60 px-4 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-slate-600 sm:px-6 lg:px-8">
          DevTask · built for developers, by developers
        </footer>
      </div>
    </div>
  );
}
