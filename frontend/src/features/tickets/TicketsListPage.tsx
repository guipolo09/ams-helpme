import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Card, Input, Select, Spinner } from "../../components/ui";
import { useTickets } from "./api";
import { ALL_PRIORITIES, ALL_STATUSES, PRIORITY_COLORS, STATUS_COLORS } from "./constants";

export function TicketsListPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useTickets({ status, priority, search });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("tickets.title")}</h1>
        <Link
          to="/tickets/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + {t("tickets.new")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">{t("tickets.filterStatus")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto">
          <option value="">{t("tickets.filterPriority")}</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {t(`priority.${p}`)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400">
            {t("tickets.empty")}
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3">{t("tickets.number")}</th>
                <th className="px-4 py-3">{t("tickets.subject")}</th>
                <th className="px-4 py-3">{t("tickets.status")}</th>
                <th className="px-4 py-3">{t("tickets.priority")}</th>
                <th className="px-4 py-3">{t("tickets.assignee")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 font-mono text-slate-400">#{ticket.number}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {ticket.title}
                    </Link>
                    {ticket.application && (
                      <span className="ml-2 text-xs text-slate-400">
                        {ticket.application.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[ticket.status]}>
                      {t(`status.${ticket.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={PRIORITY_COLORS[ticket.priority]}>
                      {t(`priority.${ticket.priority}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {ticket.assignee?.name ?? t("tickets.unassigned")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
