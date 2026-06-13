import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Button, Card, Input, Label } from "../../components/ui";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { LanguageSwitcher } from "../../components/layout/LanguageSwitcher";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("senha123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.user, data.accessToken);
      navigate("/");
    } catch (err: any) {
      setError(
        err?.response?.status === 401
          ? t("auth.invalidCredentials")
          : t("auth.genericError")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <Card>
          <h1 className="text-xl font-semibold text-brand-600">
            {t("common.appName")}
          </h1>
          <p className="mb-6 mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("auth.loginSubtitle")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.loginButton")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-medium text-brand-600">
              {t("auth.goRegister")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
