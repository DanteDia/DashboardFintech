export const dynamic = "force-dynamic";
import { getOperacionesData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { OperacionesClient } from "@/components/operaciones/operaciones-client";

export default async function OperacionesPage() {
  const { operaciones, movimientos, dashboard } = await getOperacionesData();

  // Get USD KPIs from dashboard
  const usdData = dashboard.monedas.find((m) => m.moneda === "USD");

  return (
    <PageContainer
      title="Operaciones"
      description={`${operaciones.length} operaciones registradas`}
    >
      <OperacionesClient
        operaciones={operaciones}
        movimientos={movimientos}
        dashboardKpis={{
          ingresos: usdData?.ingresos ?? 0,
          egresos: usdData?.egresos ?? 0,
          costos: usdData?.costo1 ?? 0,
          ganancias: usdData?.ganancias ?? 0,
        }}
      />
    </PageContainer>
  );
}
