import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Button, Card, Input, Label } from "../../components/ui";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { LanguageSwitcher } from "../../components/layout/LanguageSwitcher";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.user, data.accessToken);
      navigate("/");
    } catch (err: any) {
      setError(
        err?.response?.status === 409
          ? t("auth.genericError")
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
            {t("auth.registerTitle")}
          </h1>
          <p className="mb-6 mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("auth.registerSubtitle")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="org">{t("auth.organizationName")}</Label>
              <Input id="org" value={form.organizationName} onChange={update("organizationName")} required />
            </div>
            <div>
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input id="name" value={form.name} onChange={update("name")} required />
            </div>
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} required />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={form.password} onChange={update("password")} required minLength={6} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.registerButton")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="font-medium text-brand-600">
              {t("auth.goLogin")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
