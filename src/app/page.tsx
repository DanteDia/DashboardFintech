export const dynamic = "force-dynamic";
import { getOverviewData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { OverviewClient } from "@/components/overview/overview-client";

export default async function OverviewPage() {
  const { dashboard, bancos, clientes, operaciones, movimientos } =
    await getOverviewData();

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
        mesAno={`${dashboard.mes ?? "-"} / ${dashboard.ano ?? "-"}`}
      />
    </PageContainer>
  );
}
