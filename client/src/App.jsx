import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import Courses from './pages/Courses';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authView, setAuthView] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply saved theme on app load so it persists across reloads
  useEffect(() => {
    const theme = localStorage.getItem('devtask_theme') || 'dark';
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex flex-col items-center justify-center text-neonCyan font-mono">
        <div className="w-10 h-10 border-4 border-neonCyan border-t-transparent rounded-full animate-spin mb-4"></div>
        <span>Establishing handshake...</span>
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <Signup navigateToLogin={() => setAuthView('login')} />;
    }
    return <Login navigateToSignup={() => setAuthView('signup')} />;
  }

  const pageNames = {
    dashboard: 'Dashboard',
    tasks: 'Working Space',
    courses: 'Roadmaps & Courses',
    profile: 'Profile',
    settings: 'Settings'
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted select-none overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col w-0">
        <Header
          currentPageName={pageNames[currentPage]}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'tasks' && <TaskBoard />}
          {currentPage === 'courses' && <Courses />}
          {currentPage === 'profile' && <Profile onNavigateToSettings={() => setCurrentPage('settings')} />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
