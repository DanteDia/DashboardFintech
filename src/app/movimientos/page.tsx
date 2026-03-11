export const dynamic = "force-dynamic";
import { getMovimientosData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { MovimientosClient } from "@/components/movimientos/movimientos-client";

export default async function MovimientosPage() {
  const { movimientos } = await getMovimientosData();

  return (
    <PageContainer
      title="Movimientos"
      description={`${movimientos.length} movimientos registrados`}
    >
      <MovimientosClient movimientos={movimientos} />
    </PageContainer>
  );
}
