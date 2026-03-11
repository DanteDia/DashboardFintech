import { CarteraBanco, CarteraBancoVerificado } from "@/types/sheets";
import { parseNumber, isEmptyRow } from "@/lib/utils";

export function transformCarteraBancos(rows: (string | number)[][]): CarteraBanco[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      cliente: String(row[0] ?? ""),
      tipo: String(row[1] ?? ""),
      direccion: String(row[2] ?? ""),
      saldoInicial: parseNumber(String(row[3] ?? "")),
      usdCo: parseNumber(String(row[4] ?? "")),
      usdImporte: parseNumber(String(row[5] ?? "")),
      diferencia: parseNumber(String(row[6] ?? "")),
      usdMov: parseNumber(String(row[7] ?? "")),
      usdSaldo: parseNumber(String(row[8] ?? "")),
      pendiente: parseNumber(String(row[9] ?? "")),
      saldoUnificado: parseNumber(String(row[10] ?? "")),
      saldoReal: parseNumber(String(row[11] ?? "")),
    }));
}

export function transformCarteraBancosVerificado(
  rows: (string | number)[][]
): CarteraBancoVerificado[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      cliente: String(row[0] ?? ""),
      tipo: String(row[1] ?? ""),
      direccion: String(row[2] ?? ""),
      saldoInicial: parseNumber(String(row[3] ?? "")),
      usdCo: parseNumber(String(row[4] ?? "")),
      ingreso: parseNumber(String(row[5] ?? "")),
      egreso: parseNumber(String(row[6] ?? "")),
      usdMov: parseNumber(String(row[7] ?? "")),
      usdSaldo: parseNumber(String(row[8] ?? "")),
      pendiente: parseNumber(String(row[9] ?? "")),
      saldoUnificado: parseNumber(String(row[10] ?? "")),
    }));
}
