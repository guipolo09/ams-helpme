import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from "../../components/ui";
import { ALL_PRIORITIES } from "./constants";
import { useApplications, useCategories, useCreateTicket } from "./api";

export function NewTicketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateTicket();
  const { data: applications } = useApplications();
  const { data: categories } = useCategories();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIA",
    applicationId: "",
    categoryId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticket = await create.mutateAsync({
      title: form.title,
      description: form.description,
      priority: form.priority,
      applicationId: form.applicationId || null,
      categoryId: form.categoryId || null,
    });
    navigate(`/tickets/${ticket.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{t("tickets.formTitle")}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("tickets.fieldTitle")}</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t("tickets.fieldTitlePlaceholder")}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">{t("tickets.fieldDescription")}</Label>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("tickets.fieldDescriptionPlaceholder")}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="priority">{t("tickets.priority")}</Label>
              <Select
                id="priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {ALL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`priority.${p}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="application">{t("tickets.application")}</Label>
              <Select
                id="application"
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
              >
                <option value="">—</option>
                {applications?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="category">{t("tickets.category")}</Label>
              <Select
                id="category"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">—</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("common.loading") : t("tickets.submit")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
