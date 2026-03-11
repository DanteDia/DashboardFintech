export const SHEET_CONFIG = {
  movimientos: {
    name: "Movimientos",
    headerRow: 2,
    range: "Movimientos!A2:Y",
  },
  operaciones: {
    name: "Operaciones",
    headerRow: 3,
    range: "Operaciones!A3:K",
  },
  nuevoOperaciones: {
    name: "NuevoOperaciones",
    headerRow: 3,
    range: "NuevoOperaciones!A3:G",
  },
  carteraClientes: {
    name: "Cartera_Clientes",
    headerRow: 2,
    range: "Cartera_Clientes!A2:J",
  },
  carteraBancos: {
    name: "Cartera_Bancos",
    headerRow: 2,
    range: "Cartera_Bancos!A2:L",
  },
  carteraBancosVerificado: {
    name: "Cartera_Bancos_Verificado",
    headerRow: 2,
    range: "Cartera_Bancos_Verificado!A2:K",
  },
  dashboard: {
    name: "Dashboard",
    headerRow: 1,
    range: "Dashboard!A1:F14",
  },
  salidas: {
    name: "Salidas",
    headerRow: 3,
    range: "Salidas!A3:O",
  },
  compensaciones: {
    name: "Compensaciones",
    headerRow: 3,
    range: "Compensaciones!A3:R",
  },
  historicoOperaciones: {
    name: "HistoricoOperacionesInvoice",
    headerRow: 2,
    range: "HistoricoOperacionesInvoice!A2:U",
  },
  historicoEntradas: {
    name: "HistoricoEntradasPayments",
    headerRow: 2,
    range: "HistoricoEntradasPayments!A2:P",
  },
  historicoSalidas: {
    name: "HistoricoSalidasExpenses",
    headerRow: 3,
    range: "HistoricoSalidasExpenses!A3:O",
  },
} as const;

export type SheetKey = keyof typeof SHEET_CONFIG;
