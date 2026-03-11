export const dynamic = "force-dynamic";
import { getClientesData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { ClientesClient } from "@/components/clientes/clientes-client";

export default async function ClientesPage() {
  const { clientes } = await getClientesData();

  return (
    <PageContainer
      title="Cartera Clientes"
      description={`${clientes.length} clientes registrados`}
    >
      <ClientesClient clientes={clientes} />
    </PageContainer>
  );
}
