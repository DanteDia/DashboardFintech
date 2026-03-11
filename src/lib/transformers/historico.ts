import {
  HistoricoOperacion,
  HistoricoEntrada,
  HistoricoSalida,
} from "@/types/sheets";
import { parseNumber, parseDate, isEmptyRow } from "@/lib/utils";

export function transformHistoricoOperaciones(
  rows: (string | number)[][]
): HistoricoOperacion[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      fecha: parseDate(String(row[0] ?? "")),
      ano: parseNumber(String(row[1] ?? "")),
      mes: parseNumber(String(row[2] ?? "")),
      nroOperacion: parseNumber(String(row[3] ?? "")),
      status: String(row[4] ?? ""),
      tipo: String(row[5] ?? ""),
      cliente: String(row[6] ?? ""),
      importe: parseNumber(String(row[7] ?? "")),
      tasaPor: parseNumber(String(row[8] ?? "")),
      tasaImp: parseNumber(String(row[9] ?? "")),
      total: parseNumber(String(row[10] ?? "")),
      ctaCteCliente: String(row[11] ?? ""),
      comisionista: String(row[13] ?? ""),
      comisionistasPorc: String(row[14] ?? ""),
      customerId: String(row[15] ?? ""),
      zohoCustomerId: String(row[17] ?? ""),
      shippingCharge: parseNumber(String(row[18] ?? "")),
      entityDiscountAmount: parseNumber(String(row[19] ?? "")),
      deudaCliente: parseNumber(String(row[20] ?? "")),
    }));
}

export function transformHistoricoEntradas(
  rows: (string | number)[][]
): HistoricoEntrada[] {
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => !isEmptyRow(row.map(String)))
    .map((row) => ({
      date: parseDate(String(row[0] ?? "")),
      ano: parseNumber(String(row[1] ?? "")),
      mes: parseNumber(String(row[2] ?? "")),
      paymentNumber: parseNumber(String(row[3] ?? "")),
      customerName: String(row[4] ?? ""),
      depositTo: String(row[5] ?? ""),
      forma: String(row[6] ?? ""),
      customerPaymentId: String(row[7] ?? ""),
      customerId: String(row[8] ?? ""),
      unusedAmount: parseNumber(String(row[10] ?? "")),
      referenceNumber: String(row[11] ?? ""),
      invoicePaymentId: String(row[12] ?? ""),
      amountApplied: parseNumber(String(row[13] ?? "")),
      invoiceNumber: String(row[14] ?? ""),
      invoiceDate: parseDate(String(row[15] ?? "")),
    }));
}

export function transformHistoricoSalidas(
  rows: (string | number)[][]
): HistoricoSalida[] {
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
      tasaPor: parseNumber(String(row[7] ?? "")),
      tasaImp: parseNumber(String(row[8] ?? "")),
      pagado: String(row[10] ?? ""),
      ctaCtePagador: String(row[11] ?? ""),
      ctaCteBeneficiario: String(row[12] ?? ""),
      idZoho: String(row[13] ?? ""),
      vendor: String(row[14] ?? ""),
    }));
}
