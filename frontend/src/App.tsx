import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireRole } from "./components/RequireRole";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TicketsListPage } from "./features/tickets/TicketsListPage";
import { NewTicketPage } from "./features/tickets/NewTicketPage";
import { TicketDetailPage } from "./features/tickets/TicketDetailPage";
import { ApplicationsPage } from "./features/applications/ApplicationsPage";
import { UsersPage } from "./features/users/UsersPage";
import { CategoriesPage } from "./features/categories/CategoriesPage";

const STAFF = ["AGENT", "ADMIN", "SUPER_ADMIN"];
const ADMIN = ["ADMIN", "SUPER_ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsListPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route
            path="/applications"
            element={
              <RequireRole roles={STAFF}>
                <ApplicationsPage />
              </RequireRole>
            }
          />
          <Route
            path="/users"
            element={
              <RequireRole roles={ADMIN}>
                <UsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/categories"
            element={
              <RequireRole roles={ADMIN}>
                <CategoriesPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
