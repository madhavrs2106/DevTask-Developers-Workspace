import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NoupeChatbot } from "./NoupeChatbot";
import { useFullScreen } from "../../context/FullScreenContext";
import { useMe } from "../../hooks/useQueries";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { fullScreen } = useFullScreen();
  const { data: me } = useMe();

  // Apply the user's chosen app/page background via a CSS variable.
  useEffect(() => {
    const root = document.documentElement;
    if (me?.backgroundColor) root.style.setProperty("--app-bg", me.backgroundColor);
    else root.style.removeProperty("--app-bg");
  }, [me?.backgroundColor]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--app-bg, #0F172A)" }}>
      {!fullScreen && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      <div className={`flex min-h-screen flex-col ${fullScreen ? "" : "lg:pl-64"}`}>
        {!fullScreen && <Header onMenuClick={() => setSidebarOpen(true)} />}
        <main
          className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-fade-in ${
            fullScreen ? "max-w-none" : "max-w-7xl"
          }`}
        >
          <Outlet />
        </main>
        <NoupeChatbot />
      </div>
    </div>
  );
}
