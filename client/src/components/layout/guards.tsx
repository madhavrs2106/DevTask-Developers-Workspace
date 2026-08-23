import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { FullPageLoader } from "../ui/Spinner";
import { useAuth } from "../../context/AuthContext";

/** Blocks the app shell until authenticated. */
export function RequireAuth(): ReactNode {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Redirects authenticated users away from auth screens. */
export function PublicOnly({ children }: { children: ReactNode }): ReactNode {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
