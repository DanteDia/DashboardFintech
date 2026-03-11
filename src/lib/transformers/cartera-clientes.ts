import { CarteraCliente } from "@/types/sheets";
import { parseNumber, isEmptyRow } from "@/lib/utils";

export function transformCarteraClientes(rows: (string | number)[][]): CarteraCliente[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      cliente: String(row[0] ?? ""),
      tipo: String(row[1] ?? ""),
      saldoInicial: parseNumber(String(row[2] ?? "")),
      usdCo: parseNumber(String(row[3] ?? "")),
      usdImporte: parseNumber(String(row[4] ?? "")),
      diferencia: parseNumber(String(row[5] ?? "")),
      usdMov: parseNumber(String(row[6] ?? "")),
      usdSaldo: parseNumber(String(row[7] ?? "")),
      pendiente: parseNumber(String(row[8] ?? "")),
      comentario: String(row[9] ?? ""),
    }));
}
