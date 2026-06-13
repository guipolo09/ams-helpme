import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Spinner } from "../../components/ui";
import { useAuthStore } from "../../store/auth";
import { useTicketStats } from "../tickets/api";
import { STATUS_COLORS } from "../tickets/constants";

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <div className="text-3xl font-semibold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useTicketStats();

  if (isLoading) return <Spinner />;

  const byStatus = data?.byStatus ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t("dashboard.welcome", { name: user?.name })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("dashboard.total")} value={data?.total ?? 0} color="#4f46e5" />
        <StatCard
          label={t("dashboard.open")}
          value={byStatus.ABERTO ?? 0}
          color={STATUS_COLORS.ABERTO}
        />
        <StatCard
          label={t("dashboard.inProgress")}
          value={byStatus.EM_ATENDIMENTO ?? 0}
          color={STATUS_COLORS.EM_ATENDIMENTO}
        />
        <StatCard
          label={t("dashboard.resolved")}
          value={byStatus.RESOLVIDO ?? 0}
          color={STATUS_COLORS.RESOLVIDO}
        />
      </div>

      <Link
        to="/tickets/new"
        className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        + {t("tickets.new")}
      </Link>
    </div>
  );
}
