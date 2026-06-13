import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { Spinner } from "./ui";

// Tenta restaurar a sessão via refresh token (cookie) ao carregar.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (status !== "idle") return;
    api
      .post("/auth/refresh")
      .then((res) => setAuth(res.data.user, res.data.accessToken))
      .catch(() => clear());
  }, [status, setAuth, clear]);

  if (status === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
