import { Operacion } from "@/types/sheets";
import { parseNumber, isEmptyRow } from "@/lib/utils";

export function transformOperaciones(rows: (string | number)[][]): Operacion[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      operacion: String(row[0] ?? ""),
      cliente: String(row[1] ?? ""),
      ingreso: parseNumber(String(row[2] ?? "")),
      egreso: parseNumber(String(row[3] ?? "")),
      comision: parseNumber(String(row[4] ?? "")),
      diferencia: parseNumber(String(row[5] ?? "")),
      cierre: String(row[6] ?? "").toUpperCase().trim(),
      otros: parseNumber(String(row[7] ?? "")),
      usdRent: parseNumber(String(row[8] ?? "")),
      arsRent: parseNumber(String(row[9] ?? "")),
      usdtRent: parseNumber(String(row[10] ?? "")),
    }));
}
