import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Input, Label, Spinner } from "../../components/ui";
import { useAuthStore } from "../../store/auth";
import { useApplications } from "../tickets/api";

export function ApplicationsPage() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const qc = useQueryClient();

  const { data: applications, isLoading } = useApplications();
  const [form, setForm] = useState({ name: "", description: "", ownerName: "" });

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/applications", {
        name: form.name,
        description: form.description || null,
        ownerName: form.ownerName || null,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setForm({ name: "", description: "", ownerName: "" });
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("applications.title")}</h1>

      {isAdmin && (
        <Card>
          <h2 className="mb-3 text-lg font-medium">{t("applications.new")}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <div>
              <Label>{t("applications.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t("applications.description")}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("applications.owner")}</Label>
              <Input
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={create.isPending}>
                {t("common.create")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !applications?.length ? (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400">
            {t("applications.empty")}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <h3 className="font-medium">{app.name}</h3>
              {app.description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {app.description}
                </p>
              )}
              {app.ownerName && (
                <p className="mt-2 text-xs text-slate-400">
                  {t("applications.owner")}: {app.ownerName}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
