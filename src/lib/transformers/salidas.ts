import { Salida, Compensacion } from "@/types/sheets";
import { parseNumber, parseDate, isEmptyRow } from "@/lib/utils";

export function transformSalidas(rows: (string | number)[][]): Salida[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      fecha: parseDate(String(row[0] ?? "")),
      ano: parseNumber(String(row[1] ?? "")),
      mes: parseNumber(String(row[2] ?? "")),
      nroOperacion: parseNumber(String(row[3] ?? "")),
      pagador: String(row[4] ?? ""),
      beneficiario: String(row[5] ?? ""),
      importe: parseNumber(String(row[6] ?? "")),
      pTasa: parseNumber(String(row[7] ?? "")),
      pImpo: parseNumber(String(row[8] ?? "")),
      pTotal: parseNumber(String(row[9] ?? "")),
      bTasa: parseNumber(String(row[10] ?? "")),
      bImpo: parseNumber(String(row[11] ?? "")),
      bTotal: parseNumber(String(row[12] ?? "")),
      verificado: String(row[13] ?? ""),
      comentario: String(row[14] ?? ""),
    }));
}

export function transformCompensaciones(rows: (string | number)[][]): Compensacion[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      fecha: parseDate(String(row[0] ?? "")),
      ano: parseNumber(String(row[1] ?? "")),
      mes: parseNumber(String(row[2] ?? "")),
      nroOperacion: parseNumber(String(row[3] ?? "")),
      pagador: String(row[4] ?? ""),
      beneficiario: String(row[5] ?? ""),
      importe: parseNumber(String(row[6] ?? "")),
      pTasa: parseNumber(String(row[7] ?? "")),
      pImpo: parseNumber(String(row[8] ?? "")),
      pTotal: parseNumber(String(row[9] ?? "")),
      bTasa: parseNumber(String(row[10] ?? "")),
      bImpo: parseNumber(String(row[11] ?? "")),
      bTotal: parseNumber(String(row[12] ?? "")),
      verificado: String(row[13] ?? ""),
      comentario: String(row[14] ?? ""),
      pagado: String(row[15] ?? ""),
      ctaCtePagador: String(row[16] ?? ""),
      ctaCteBeneficiario: String(row[17] ?? ""),
    }));
}
