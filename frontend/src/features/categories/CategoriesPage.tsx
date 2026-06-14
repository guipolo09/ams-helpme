import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Input, Label, Spinner } from "../../components/ui";

interface CategoryRow {
  id: string;
  name: string;
  color: string | null;
}

export function CategoriesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data as CategoryRow[],
  });

  const [form, setForm] = useState({ name: "", color: "#378ADD" });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/categories", { name: form.name, color: form.color })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setForm({ name: "", color: "#378ADD" });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("categories.title")}</h1>

      <Card>
        <h2 className="mb-3 text-lg font-medium">{t("categories.new")}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="grow">
            <Label>{t("categories.name")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>{t("categories.color")}</Label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <Button type="submit" disabled={create.isPending}>
            {t("common.create")}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : !categories?.length ? (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400">{t("categories.empty")}</p>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Card key={c.id} className="flex items-center gap-3 py-3">
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.color ?? "#888" }} />
              <span className="font-medium">{c.name}</span>
              <button
                onClick={() => remove.mutate(c.id)}
                className="text-sm text-red-600 hover:underline"
                disabled={remove.isPending}
              >
                {t("categories.delete")}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
