export const dynamic = "force-dynamic";
import { getSalidasData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { SalidasClient } from "@/components/salidas/salidas-client";

export default async function SalidasPage() {
  const { salidas, compensaciones } = await getSalidasData();

  return (
    <PageContainer
      title="Salidas y Compensaciones"
      description={`${salidas.length} salidas, ${compensaciones.length} compensaciones`}
    >
      <SalidasClient salidas={salidas} compensaciones={compensaciones} />
    </PageContainer>
  );
}
