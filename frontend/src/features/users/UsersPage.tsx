import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, Input, Label, Select, Spinner } from "../../components/ui";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  isActive: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  REQUESTER: "#5F5E5A",
  AGENT: "#185FA5",
  ADMIN: "#534AB7",
  SUPER_ADMIN: "#993556",
};

export function UsersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data as UserRow[],
  });

  const empty = { name: "", email: "", password: "", role: "REQUESTER", department: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department || undefined,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm(empty);
      setError("");
    },
    onError: (e: any) => {
      setError(
        e?.response?.status === 409
          ? t("users.emailInUse")
          : t("auth.genericError")
      );
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("users.title")}</h1>

      <Card>
        <h2 className="mb-3 text-lg font-medium">{t("users.new")}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <Label>{t("users.name")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>{t("users.email")}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>{t("users.password")}</Label>
            <Input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <Label>{t("users.role")}</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="REQUESTER">{t("role.REQUESTER")}</option>
              <option value="AGENT">{t("role.AGENT")}</option>
              <option value="ADMIN">{t("role.ADMIN")}</option>
            </Select>
          </div>
          <div>
            <Label>{t("users.department")}</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("common.loading") : t("common.create")}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
        </form>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : !users?.length ? (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400">{t("users.empty")}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3">{t("users.name")}</th>
                <th className="px-4 py-3">{t("users.email")}</th>
                <th className="px-4 py-3">{t("users.role")}</th>
                <th className="px-4 py-3">{t("users.department")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={ROLE_COLORS[u.role]}>{t(`role.${u.role}`)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.department ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
