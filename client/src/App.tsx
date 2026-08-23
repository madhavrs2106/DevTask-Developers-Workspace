import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { PublicOnly, RequireAuth } from "./components/layout/guards";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { TaskBoard } from "./pages/TaskBoard";
import { TaskList } from "./pages/TaskList";
import { Projects } from "./pages/Projects";
import { Courses } from "./pages/Courses";
import { SearchPage } from "./pages/SearchPage";
import { UserProfile } from "./pages/UserProfile";
import { FollowList } from "./pages/FollowList";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { useAuth } from "./context/AuthContext";
import { applyAccent } from "./lib/accent";

export default function App() {
  const { user } = useAuth();

  // The chosen avatarColor themes the whole app (buttons, glows, charts…)
  useEffect(() => {
    applyAccent(user?.avatarColor);
  }, [user?.avatarColor]);

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <Signup />
          </PublicOnly>
        }
      />

      {/* Protected app shell */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="board" element={<TaskBoard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="projects" element={<Projects />} />
          <Route path="courses" element={<Courses />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="u/:username" element={<UserProfile />} />
          <Route path="u/:username/:type" element={<FollowList />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
