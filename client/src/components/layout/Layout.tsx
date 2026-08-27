import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NoupeChatbot } from "./NoupeChatbot";
import { useFullScreen } from "../../context/FullScreenContext";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { fullScreen } = useFullScreen();

  return (
    <div className="min-h-screen bg-midnight">
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
