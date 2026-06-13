import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  Label,
  Select,
  Spinner,
  Textarea,
} from "../../components/ui";
import { isStaff, useAuthStore } from "../../store/auth";
import {
  useAddComment,
  useAgents,
  useAssign,
  useTicket,
  useUpdateStatus,
} from "./api";
import { ALL_STATUSES, PRIORITY_COLORS, STATUS_COLORS } from "./constants";

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const { t, i18n } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const staff = isStaff(role);

  const { data: ticket, isLoading } = useTicket(id);
  const addComment = useAddComment();
  const updateStatus = useUpdateStatus();
  const assign = useAssign();
  const { data: agents } = useAgents(staff);

  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);

  if (isLoading || !ticket) return <Spinner />;

  const fmt = (d: string) =>
    new Date(d).toLocaleString(i18n.resolvedLanguage || "pt-BR");

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment.mutateAsync({ id, body: comment, isInternal: internal });
    setComment("");
    setInternal(false);
  }

  return (
    <div className="space-y-5">
      <Link to="/tickets" className="text-sm text-brand-600 hover:underline">
        ← {t("common.back")}
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-slate-400">#{ticket.number}</span>
              <Badge color={STATUS_COLORS[ticket.status]}>
                {t(`status.${ticket.status}`)}
              </Badge>
              <Badge color={PRIORITY_COLORS[ticket.priority]}>
                {t(`priority.${ticket.priority}`)}
              </Badge>
            </div>
            <h1 className="text-xl font-semibold">{ticket.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {ticket.description}
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-medium">{t("tickets.conversation")}</h2>
            <div className="space-y-3">
              {ticket.comments.length === 0 && (
                <p className="text-sm text-slate-400">{t("tickets.noComments")}</p>
              )}
              {ticket.comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg border p-3 ${
                    c.isInternal
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {c.author.name}
                    </span>
                    <span>{t(`role.${c.author.role}`)}</span>
                    {c.isInternal && (
                      <span className="text-amber-600">
                        · {t("tickets.internalNote")}
                      </span>
                    )}
                    <span className="ml-auto">{fmt(c.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={submitComment} className="mt-4 space-y-2">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("tickets.commentPlaceholder")}
              />
              <div className="flex items-center justify-between">
                {staff ? (
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    {t("tickets.internalNote")}
                  </label>
                ) : (
                  <span />
                )}
                <Button type="submit" disabled={addComment.isPending}>
                  {t("common.send")}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 text-lg font-medium">{t("tickets.details")}</h2>
            <dl className="space-y-2 text-sm">
              <Row label={t("tickets.requester")} value={ticket.requester.name} />
              <Row
                label={t("tickets.assignee")}
                value={ticket.assignee?.name ?? t("tickets.unassigned")}
              />
              <Row
                label={t("tickets.application")}
                value={ticket.application?.name ?? "—"}
              />
              <Row
                label={t("tickets.category")}
                value={ticket.category?.name ?? "—"}
              />
              <Row label={t("tickets.createdAt")} value={fmt(ticket.createdAt)} />
            </dl>
          </Card>

          <Card>
            <Label>{t("tickets.changeStatus")}</Label>
            <Select
              value={ticket.status}
              onChange={(e) => updateStatus.mutate({ id, status: e.target.value })}
              disabled={updateStatus.isPending}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </Select>

            {staff && (
              <div className="mt-4">
                <Label>{t("tickets.assignTo")}</Label>
                <Select
                  value={ticket.assignee?.id ?? ""}
                  onChange={(e) =>
                    assign.mutate({ id, assigneeId: e.target.value || null })
                  }
                  disabled={assign.isPending}
                >
                  <option value="">{t("tickets.unassigned")}</option>
                  {agents?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
