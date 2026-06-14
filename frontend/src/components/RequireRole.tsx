import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

// Protege rotas por papel. Usar dentro do ProtectedRoute (usuário já carregado).
export function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
