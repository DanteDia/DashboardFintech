export const dynamic = "force-dynamic";
import { getHistoricoData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { HistoricoClient } from "@/components/historico/historico-client";

export default async function HistoricoPage() {
  const { operaciones, entradas, salidas } = await getHistoricoData();

  return (
    <PageContainer
      title="Historico"
      description="Datos legacy de Zoho (Mayo 2024 - Octubre 2025)"
    >
      <HistoricoClient
        operaciones={operaciones}
        entradas={entradas}
        salidas={salidas}
      />
    </PageContainer>
  );
}
