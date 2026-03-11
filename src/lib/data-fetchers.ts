import { unstable_cache } from "next/cache";
import { fetchSheetRanges } from "./google-sheets";
import { SHEET_CONFIG } from "./sheets-config";
import { transformMovimientos } from "./transformers/movimientos";
import { transformOperaciones } from "./transformers/operaciones";
import { transformCarteraClientes } from "./transformers/cartera-clientes";
import {
  transformCarteraBancos,
  transformCarteraBancosVerificado,
} from "./transformers/cartera-bancos";
import { transformDashboardKPIs } from "./transformers/dashboard-kpis";
import { transformSalidas, transformCompensaciones } from "./transformers/salidas";
import {
  transformHistoricoOperaciones,
  transformHistoricoEntradas,
  transformHistoricoSalidas,
} from "./transformers/historico";

const REVALIDATE = 300; // 5 minutes

// Overview page data
export const getOverviewData = unstable_cache(
  async () => {
    const [dashboardRows, bancosRows, clientesRows, operacionesRows, movimientosRows] =
      await fetchSheetRanges([
        SHEET_CONFIG.dashboard.range,
        SHEET_CONFIG.carteraBancos.range,
        SHEET_CONFIG.carteraClientes.range,
        SHEET_CONFIG.operaciones.range,
        SHEET_CONFIG.movimientos.range,
      ]);

    return {
      dashboard: transformDashboardKPIs(dashboardRows),
      bancos: transformCarteraBancos(bancosRows),
      clientes: transformCarteraClientes(clientesRows),
      operaciones: transformOperaciones(operacionesRows),
      movimientos: transformMovimientos(movimientosRows),
    };
  },
  ["overview-data"],
  { revalidate: REVALIDATE }
);

// Operaciones page data
export const getOperacionesData = unstable_cache(
  async () => {
    const [operacionesRows, movimientosRows, dashboardRows] = await fetchSheetRanges([
      SHEET_CONFIG.operaciones.range,
      SHEET_CONFIG.movimientos.range,
      SHEET_CONFIG.dashboard.range,
    ]);

    return {
      operaciones: transformOperaciones(operacionesRows),
      movimientos: transformMovimientos(movimientosRows),
      dashboard: transformDashboardKPIs(dashboardRows),
    };
  },
  ["operaciones-data"],
  { revalidate: REVALIDATE }
);

// Clientes page data
export const getClientesData = unstable_cache(
  async () => {
    const [clientesRows] = await fetchSheetRanges([
      SHEET_CONFIG.carteraClientes.range,
    ]);

    return {
      clientes: transformCarteraClientes(clientesRows),
    };
  },
  ["clientes-data"],
  { revalidate: REVALIDATE }
);

// Bancos page data
export const getBancosData = unstable_cache(
  async () => {
    const [bancosRows, bancosVerifRows] = await fetchSheetRanges([
      SHEET_CONFIG.carteraBancos.range,
      SHEET_CONFIG.carteraBancosVerificado.range,
    ]);

    return {
      bancos: transformCarteraBancos(bancosRows),
      bancosVerificado: transformCarteraBancosVerificado(bancosVerifRows),
    };
  },
  ["bancos-data"],
  { revalidate: REVALIDATE }
);

// Movimientos page data
export const getMovimientosData = unstable_cache(
  async () => {
    const [movimientosRows] = await fetchSheetRanges([
      SHEET_CONFIG.movimientos.range,
    ]);

    return {
      movimientos: transformMovimientos(movimientosRows),
    };
  },
  ["movimientos-data"],
  { revalidate: REVALIDATE }
);

// Salidas page data
export const getSalidasData = unstable_cache(
  async () => {
    const [salidasRows, compensacionesRows] = await fetchSheetRanges([
      SHEET_CONFIG.salidas.range,
      SHEET_CONFIG.compensaciones.range,
    ]);

    return {
      salidas: transformSalidas(salidasRows),
      compensaciones: transformCompensaciones(compensacionesRows),
    };
  },
  ["salidas-data"],
  { revalidate: REVALIDATE }
);

// Historico page data
export const getHistoricoData = unstable_cache(
  async () => {
    const [opsRows, entradasRows, salidasRows] = await fetchSheetRanges([
      SHEET_CONFIG.historicoOperaciones.range,
      SHEET_CONFIG.historicoEntradas.range,
      SHEET_CONFIG.historicoSalidas.range,
    ]);

    return {
      operaciones: transformHistoricoOperaciones(opsRows),
      entradas: transformHistoricoEntradas(entradasRows),
      salidas: transformHistoricoSalidas(salidasRows),
    };
  },
  ["historico-data"],
  { revalidate: REVALIDATE }
);
