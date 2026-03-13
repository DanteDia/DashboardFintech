import { Movimiento } from "@/types/sheets";
import { parseNumber, parseDate, isEmptyRow } from "@/lib/utils";

export function transformMovimientos(rows: (string | number)[][]): Movimiento[] {
  // First row is the header, skip it
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      fecha: parseDate(row[0] ?? ""),
      ano: parseNumber(String(row[1] ?? "")),
      mes: parseNumber(String(row[2] ?? "")),
      op: String(row[3] ?? ""),
      vinculante: String(row[4] ?? ""),
      estado: String(row[5] ?? ""),
      tipo: String(row[6] ?? ""),
      origen: String(row[7] ?? ""),
      destino: String(row[8] ?? ""),
      importe: parseNumber(String(row[9] ?? "")),
      moneda: String(row[10] ?? ""),
      porc1: parseNumber(String(row[11] ?? "")),
      cImpo: parseNumber(String(row[12] ?? "")),
      cTotal: parseNumber(String(row[13] ?? "")),
      v1: String(row[14] ?? ""),
      porc2: parseNumber(String(row[15] ?? "")),
      dImpo: parseNumber(String(row[16] ?? "")),
      dTotal: parseNumber(String(row[17] ?? "")),
      v2: String(row[18] ?? ""),
      cotRef: parseNumber(String(row[19] ?? "")),
      comentario: String(row[20] ?? ""),
      customerId: String(row[21] ?? ""),
      usd: parseNumber(String(row[22] ?? "")),
      ars: parseNumber(String(row[23] ?? "")),
      usdt: String(row[24] ?? ""),
    }));
}
