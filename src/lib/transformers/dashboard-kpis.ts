import { DashboardKPI } from "@/types/sheets";
import { parseNumber } from "@/lib/utils";

export function transformDashboardKPIs(rows: (string | number)[][]): DashboardKPI {
  // Dashboard sheet has a fixed structure:
  // Row 0: AÑO: value
  // Row 1: MES: value
  // Row 2: ESTADO: value
  // Row 3: empty or header
  // Row 4: MONEDA | INGRESOS | Costo1 | EGRESOS | GANANCIAS | IMPORTE
  // Rows 5+: currency rows (ARS, USD, USDT, EUR)

  const ano = parseNumber(String(rows[0]?.[1] ?? ""));
  const mes = parseNumber(String(rows[1]?.[1] ?? ""));
  const estado = String(rows[2]?.[1] ?? "");

  const monedas: DashboardKPI["monedas"] = [];

  // Start reading currency rows from row index 4 or 5
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const moneda = String(row[0]).trim();
    if (!moneda || moneda === "MONEDA") continue;

    monedas.push({
      moneda,
      ingresos: parseNumber(String(row[1] ?? "")),
      costo1: parseNumber(String(row[2] ?? "")),
      egresos: parseNumber(String(row[3] ?? "")),
      ganancias: parseNumber(String(row[4] ?? "")),
      importe: parseNumber(String(row[5] ?? "")),
    });
  }

  return { ano, mes, estado, monedas };
}
