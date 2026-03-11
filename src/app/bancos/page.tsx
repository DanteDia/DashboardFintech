export const dynamic = "force-dynamic";
import { getBancosData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { BancosClient } from "@/components/bancos/bancos-client";

export default async function BancosPage() {
  const { bancos, bancosVerificado } = await getBancosData();

  return (
    <PageContainer
      title="Cartera Bancos"
      description={`${bancos.length} bancos/billeteras`}
    >
      <BancosClient bancos={bancos} bancosVerificado={bancosVerificado} />
    </PageContainer>
  );
}
