export const dynamic = "force-dynamic";
import { getOverviewData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { OverviewClient } from "@/components/overview/overview-client";

export default async function OverviewPage() {
  const { dashboard, bancos, clientes, operaciones, movimientos } =
    await getOverviewData();

  // Get USD KPIs from dashboard sheet
  const usdData = dashboard.monedas.find((m) => m.moneda === "USD");

  return (
    <PageContainer
      title="Overview"
      description={`Resumen del mes ${dashboard.mes ?? "-"} / ${dashboard.ano ?? "-"}`}
    >
      <OverviewClient
        operaciones={operaciones}
        movimientos={movimientos}
        bancos={bancos}
        clientes={clientes}
        dashboardKpis={{
          ingresos: usdData?.ingresos ?? 0,
          egresos: usdData?.egresos ?? 0,
          costos: usdData?.costo1 ?? 0,
          ganancias: usdData?.ganancias ?? 0,
        }}
        mesAno={`${dashboard.mes ?? "-"} / ${dashboard.ano ?? "-"}`}
      />
    </PageContainer>
  );
}
