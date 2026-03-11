export const dynamic = "force-dynamic";
import { getBancosData } from "@/lib/data-fetchers";
import { PageContainer } from "@/components/layout/page-container";
import { BancosClient } from "@/components/bancos/bancos-client";

function isMercuryCards(name: string) {
  const n = name.toLowerCase().trim();
  return n === "mercury cards" || (n.startsWith("mercury cards") && (n.includes("salida") || n.includes("ingreso")));
}

export default async function BancosPage() {
  const { bancos, bancosVerificado } = await getBancosData();
  const filtered = bancos.filter((b) => !isMercuryCards(b.cliente));

  return (
    <PageContainer
      title="Cartera Bancos"
      description={`${filtered.length} bancos/billeteras`}
    >
      <BancosClient bancos={bancos} bancosVerificado={bancosVerificado} />
    </PageContainer>
  );
}
