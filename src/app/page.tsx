export const dynamic = "force-dynamic";
import { getOverviewData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  BankBalanceChart,
  OperationsStatusChart,
} from "@/components/overview/overview-charts";
import { formatCurrencyRound } from "@/lib/utils";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Landmark,
  Users,
  AlertCircle,
} from "lucide-react";

export default async function OverviewPage() {
  const { dashboard, bancos, clientes, operaciones } = await getOverviewData();

  // Get USD KPIs from dashboard sheet
  const usdData = dashboard.monedas.find((m) => m.moneda === "USD");
  const ingresos = usdData?.ingresos ?? 0;
  const egresos = usdData?.egresos ?? 0;
  const ganancias = usdData?.ganancias ?? 0;

  // Bank totals
  const totalBancos = bancos.reduce((sum, b) => sum + (b.usdSaldo ?? 0), 0);

  // Client receivables/payables — all clients with saldo, regardless of tipo
  const clientesConSaldo = clientes.filter((c) => c.usdSaldo != null && c.usdSaldo !== 0);
  const clientesNosDeben = clientes.filter((c) => (c.usdSaldo ?? 0) > 0);
  const clientesLesDebemos = clientes.filter((c) => (c.usdSaldo ?? 0) < 0);

  const cuentasPorCobrar = clientesNosDeben.reduce(
    (sum, c) => sum + (c.usdSaldo ?? 0),
    0
  );
  const deudas = clientesLesDebemos.reduce(
    (sum, c) => sum + (c.usdSaldo ?? 0),
    0
  );

  // Operations counts
  const cerradas = operaciones.filter(
    (o) => o.cierre.toUpperCase().trim() === "CERRADO"
  ).length;
  const abiertas = operaciones.length - cerradas;

  return (
    <PageContainer
      title="Overview"
      description={`Resumen del mes ${dashboard.mes ?? "-"} / ${dashboard.ano ?? "-"}`}
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Ingresos"
          value={formatCurrencyRound(ingresos)}
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="Egresos"
          value={formatCurrencyRound(egresos)}
          icon={TrendingDown}
        />
        <KpiCard
          title="Ganancias"
          value={formatCurrencyRound(ganancias)}
          icon={TrendingUp}
          trend="up"
        />
        <KpiCard
          title="Balance Bancos"
          value={formatCurrencyRound(totalBancos)}
          icon={Landmark}
        />
        <KpiCard
          title="Cuentas x Cobrar"
          value={formatCurrencyRound(cuentasPorCobrar)}
          icon={Users}
          subtitle={`${clientesNosDeben.length} clientes`}
        />
        <KpiCard
          title="Deudas"
          value={formatCurrencyRound(Math.abs(deudas))}
          icon={AlertCircle}
          trend="down"
          subtitle={`${clientesLesDebemos.length} clientes`}
        />
      </div>

      {/* Operations summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Operaciones Cerradas"
          value={String(cerradas)}
          subtitle={`de ${operaciones.length} totales`}
        />
        <KpiCard
          title="Operaciones Abiertas"
          value={String(abiertas)}
          subtitle="DEBE + DEBEMOS"
          trend={abiertas > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BankBalanceChart bancos={bancos} />
        <OperationsStatusChart operaciones={operaciones} />
      </div>
    </PageContainer>
  );
}
