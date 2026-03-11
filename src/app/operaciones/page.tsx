export const dynamic = "force-dynamic";
import { getOperacionesData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { OperacionesClient } from "@/components/operaciones/operaciones-client";

export default async function OperacionesPage() {
  const { operaciones, movimientos } = await getOperacionesData();

  return (
    <PageContainer
      title="Operaciones"
      description={`${operaciones.length} operaciones registradas`}
    >
      <OperacionesClient
        operaciones={operaciones}
        movimientos={movimientos}
      />
    </PageContainer>
  );
}
