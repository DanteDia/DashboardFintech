"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/info-tooltip";
import { Operacion, Movimiento, CarteraBanco, CarteraCliente } from "@/types/sheets";
import { OPERATION_COLORS, MONTHS } from "@/lib/constants";
import {
  formatCurrency,
  formatCurrencyRound,
  formatCompactNumber,
  toDate,
} from "@/lib/utils";
import {
  TrendingUp,
  Hash,
  Users,
  Receipt,
  Landmark,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";

interface DashboardKpis {
  ingresos: number;
  egresos: number;
  costos: number;
  ganancias: number;
}

interface OverviewClientProps {
  operaciones: Operacion[];
  movimientos: Movimiento[];
  bancos: CarteraBanco[];
  clientes: CarteraCliente[];
  dashboardKpis: DashboardKpis;
  mesAno: string;
}

function isMercuryCards(name: string) {
  const n = name.toLowerCase().trim();
  return n === "mercury cards" || (n.startsWith("mercury cards") && (n.includes("salida") || n.includes("ingreso")));
}

function getOpType(op: string): string {
  if (op.startsWith("INC-")) return "Income Wire";
  if (op.startsWith("OUT-")) return "Outcome Wire";
  if (op.startsWith("USD-")) return "USDT";
  if (op.startsWith("NAN-")) return "Nanocard";
  if (op.startsWith("CTC-")) return "Cash To Cash";
  if (op.startsWith("INT-")) return "Intereses";
  return "Otro";
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonthYear(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]?.slice(0, 3)} ${String(y).slice(2)}`;
}

export function OverviewClient({
  operaciones,
  movimientos,
  bancos: rawBancos,
  clientes,
  dashboardKpis,
  mesAno,
}: OverviewClientProps) {
  const bancos = rawBancos.filter((b) => !isMercuryCards(b.cliente));
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Available months from movimientos
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    movimientos.forEach((m) => {
      const d = toDate(m.fecha);
      if (d) months.add(monthKey(d));
    });
    return [...months].sort().reverse();
  }, [movimientos]);

  // Derive operation closed/open status from movimientos
  const opClosedMap = useMemo(() => {
    const inflows: Record<string, number> = {};
    const outflows: Record<string, number> = {};
    const comisiones: Record<string, number> = {};

    movimientos.forEach((m) => {
      const opCode = m.op?.trim();
      const vincCode = m.vinculante?.trim();
      if (opCode) {
        inflows[opCode] = (inflows[opCode] || 0) + (m.importe ?? 0);
        comisiones[opCode] = (comisiones[opCode] || 0) + (m.cImpo ?? 0);
      }
      if (vincCode) {
        outflows[vincCode] = (outflows[vincCode] || 0) + (m.importe ?? 0);
      }
    });

    const map = new Map<string, boolean>();
    const allCodes = new Set([...Object.keys(inflows), ...Object.keys(outflows)]);
    allCodes.forEach((code) => {
      const hasIn = (inflows[code] ?? 0) > 0;
      const hasOut = (outflows[code] ?? 0) > 0;
      if (hasIn && hasOut) {
        const diff = (inflows[code] ?? 0) - (outflows[code] ?? 0);
        const comision = comisiones[code] ?? 0;
        map.set(code, Math.abs(diff - comision) <= 1);
      } else {
        map.set(code, false);
      }
    });
    return map;
  }, [movimientos]);

  // Unique clients for filter
  const uniqueClients = useMemo(
    () => [...new Set(operaciones.map((o) => o.cliente).filter(Boolean))].sort(),
    [operaciones]
  );

  // Filtered operaciones
  const filteredOps = useMemo(() => {
    return operaciones.filter((op) => {
      if (filterStatus !== "all") {
        const derived = opClosedMap.get(op.operacion) === true ? "CERRADO" : "ABIERTA";
        if (derived !== filterStatus) return false;
      }
      if (filterType !== "all" && getOpType(op.operacion) !== filterType) return false;
      if (filterClient !== "all" && op.cliente !== filterClient) return false;
      return true;
    });
  }, [operaciones, filterStatus, filterType, filterClient, opClosedMap]);

  // Filtered movimientos
  const filteredMovimientos = useMemo(() => {
    let result = movimientos;
    if (filterMonth !== "all") {
      const [year, month] = filterMonth.split("-").map(Number);
      result = result.filter((m) => {
        const d = toDate(m.fecha);
        if (!d) return false;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }
    if (filterType !== "all" || filterClient !== "all") {
      const opIds = new Set(filteredOps.map((o) => o.operacion));
      result = result.filter((m) => opIds.has(m.op));
    }
    return result;
  }, [movimientos, filteredOps, filterType, filterClient, filterMonth]);

  // KPI computations
  const totalTransacciones = filteredMovimientos.length;
  const uniqueClientCount = new Set(filteredOps.map((o) => o.cliente).filter(Boolean)).size;

  // Filtered KPIs from movimientos
  const filteredKpis = useMemo(() => {
    const anyFilterActive = filterMonth !== "all" || filterType !== "all" || filterClient !== "all";
    if (!anyFilterActive) return dashboardKpis;
    let ingresos = 0, egresos = 0, ganancias = 0, costos = 0;
    filteredMovimientos.forEach((m) => {
      if (m.op?.trim()) { ingresos += m.importe ?? 0; ganancias += m.cImpo ?? 0; costos += Math.abs(m.dImpo ?? 0); }
      if (m.vinculante?.trim()) { egresos += m.importe ?? 0; }
    });
    return { ingresos, egresos, ganancias, costos };
  }, [filteredMovimientos, dashboardKpis, filterMonth, filterType, filterClient]);

  // Bank totals
  const totalBancos = bancos.reduce((sum, b) => sum + (b.usdSaldo ?? 0), 0);

  // Client receivables/payables (filtered)
  const filteredClientes = useMemo(() => {
    if (filterClient === "all") return clientes;
    return clientes.filter((c) => c.cliente === filterClient);
  }, [clientes, filterClient]);
  const clientesNosDeben = filteredClientes.filter((c) => (c.usdSaldo ?? 0) > 0);
  const clientesLesDebemos = filteredClientes.filter((c) => (c.usdSaldo ?? 0) < 0);
  const cuentasPorCobrar = clientesNosDeben.reduce((s, c) => s + (c.usdSaldo ?? 0), 0);
  const deudas = clientesLesDebemos.reduce((s, c) => s + (c.usdSaldo ?? 0), 0);

  // Operations counts
  const cerradas = filteredOps.filter((o) => opClosedMap.get(o.operacion) === true).length;
  const abiertas = filteredOps.length - cerradas;

  // ─── CHART DATA ───

  // 1. Monthly timeline from movimientos only:
  // - Clientes: unique names from col H (origen) + col I (destino), empties don't count
  // - Ganancias: sum of col M (cImpo) + col Q (dImpo)
  // - Operaciones: unique op codes from col D (op) + col E (vinculante), empties don't count
  const monthlyTimeline = useMemo(() => {
    const byMonth: Record<string, { ops: Set<string>; clients: Set<string>; ganancia: number }> = {};
    movimientos.forEach((m) => {
      const d = toDate(m.fecha);
      if (!d) return;
      // Apply filters
      const opCode = m.op?.trim();
      if (filterType !== "all" && opCode && getOpType(opCode) !== filterType) return;
      if (filterClient !== "all") {
        const hasClient = m.origen === filterClient || m.destino === filterClient;
        if (!hasClient) return;
      }
      const mk = monthKey(d);
      if (!byMonth[mk]) byMonth[mk] = { ops: new Set(), clients: new Set(), ganancia: 0 };
      // Ops: unique codes from col D and col E (non-empty)
      if (opCode) byMonth[mk].ops.add(opCode);
      const vincCode = m.vinculante?.trim();
      if (vincCode) byMonth[mk].ops.add(vincCode);
      // Clients: unique names from col H (origen) and col I (destino) (non-empty)
      if (m.origen?.trim()) byMonth[mk].clients.add(m.origen.trim());
      if (m.destino?.trim()) byMonth[mk].clients.add(m.destino.trim());
      // Ganancias: sum of col M (cImpo) + col Q (dImpo)
      byMonth[mk].ganancia += (m.cImpo ?? 0) + (m.dImpo ?? 0);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        mes: shortMonthYear(key),
        Operaciones: v.ops.size,
        Clientes: v.clients.size,
        Ganancia: Math.round(v.ganancia),
      }));
  }, [movimientos, filterType, filterClient]);

  // 2. Ganancias mes a mes (bar chart)
  const gananciasMensuales = useMemo(() => {
    const byMonth: Record<string, number> = {};
    movimientos.forEach((m) => {
      const d = toDate(m.fecha);
      const opCode = m.op?.trim();
      if (!d || !opCode) return;
      if (filterType !== "all" && getOpType(opCode) !== filterType) return;
      if (filterClient !== "all") {
        const opObj = operaciones.find((o) => o.operacion === opCode);
        if (opObj && opObj.cliente !== filterClient) return;
      }
      const mk = monthKey(d);
      byMonth[mk] = (byMonth[mk] || 0) + (m.cImpo ?? 0);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ mes: shortMonthYear(key), ganancia: Math.round(val) }));
  }, [movimientos, operaciones, filterType, filterClient]);

  // 3. Ganancia + transacciones por producto (filtered by date)
  const byProductData = useMemo(() => {
    const byType: Record<string, { ganancia: number; txs: number }> = {};
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      if (!opCode) return;
      const tipo = getOpType(opCode);
      if (!byType[tipo]) byType[tipo] = { ganancia: 0, txs: 0 };
      byType[tipo].ganancia += m.cImpo ?? 0;
      byType[tipo].txs++;
    });
    return Object.entries(byType)
      .map(([name, v]) => ({ name, ganancia: Math.round(v.ganancia), transacciones: v.txs }))
      .sort((a, b) => b.ganancia - a.ganancia);
  }, [filteredMovimientos]);

  // 4. Margen de ganancia por producto: ganancia / ingresos %
  const marginByProduct = useMemo(() => {
    const byType: Record<string, { ganancia: number; ingresos: number }> = {};
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      if (!opCode) return;
      const tipo = getOpType(opCode);
      if (!byType[tipo]) byType[tipo] = { ganancia: 0, ingresos: 0 };
      byType[tipo].ganancia += m.cImpo ?? 0;
      byType[tipo].ingresos += m.importe ?? 0;
    });
    return Object.entries(byType)
      .filter(([, v]) => v.ingresos > 0)
      .map(([name, v]) => ({
        name,
        margen: Number(((v.ganancia / v.ingresos) * 100).toFixed(2)),
        color: OPERATION_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.margen - a.margen);
  }, [filteredMovimientos]);

  // 5. % cobrado a clientes: cImpo (col M) / importe (col J)
  const chargeRateByType = useMemo(() => {
    const byType: Record<string, { comision: number; importe: number }> = {};
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      if (!opCode) return;
      const tipo = getOpType(opCode);
      if (!byType[tipo]) byType[tipo] = { comision: 0, importe: 0 };
      byType[tipo].comision += m.cImpo ?? 0;
      byType[tipo].importe += m.importe ?? 0;
    });
    return Object.entries(byType)
      .filter(([, v]) => v.importe > 0)
      .map(([name, v]) => ({
        name,
        tasa: Number(((v.comision / v.importe) * 100).toFixed(2)),
        color: OPERATION_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.tasa - a.tasa);
  }, [filteredMovimientos]);

  // 6. Clientes más recurrentes + mejores clientes
  const topRecurrentClients = useMemo(() => {
    const byClient: Record<string, number> = {};
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      if (!opCode) return;
      const opObj = operaciones.find((o) => o.operacion === opCode);
      if (opObj?.cliente) byClient[opObj.cliente] = (byClient[opObj.cliente] || 0) + 1;
    });
    return Object.entries(byClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, transacciones: count }));
  }, [filteredMovimientos, operaciones]);

  const topProfitClients = useMemo(() => {
    const byClient: Record<string, number> = {};
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      if (!opCode) return;
      const opObj = operaciones.find((o) => o.operacion === opCode);
      if (opObj?.cliente) byClient[opObj.cliente] = (byClient[opObj.cliente] || 0) + (m.cImpo ?? 0);
    });
    return Object.entries(byClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, ganancia]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, ganancia: Math.round(ganancia) }));
  }, [filteredMovimientos, operaciones]);

  // Provider dependency
  const providerDependency = useMemo(() => {
    const byType: Record<string, { ganancia: number; costo: number }> = {};
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      if (!opCode) return;
      const tipo = getOpType(opCode);
      if (!byType[tipo]) byType[tipo] = { ganancia: 0, costo: 0 };
      byType[tipo].ganancia += m.cImpo ?? 0;
      byType[tipo].costo += Math.abs(m.dImpo ?? 0);
    });
    return Object.entries(byType)
      .filter(([, v]) => v.ganancia > 0 || v.costo > 0)
      .map(([name, v]) => ({ name, ganancia: v.ganancia, costo: v.costo, color: OPERATION_COLORS[name] || "#94a3b8" }))
      .sort((a, b) => b.ganancia + b.costo - (a.ganancia + a.costo));
  }, [filteredMovimientos]);

  // Ganancias gauge
  const bestMonthTarget = Math.max(dashboardKpis.ganancias * 1.15, 1);
  const gananciaProgress = Math.min((filteredKpis.ganancias / bestMonthTarget) * 100, 100);
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const estimatedProfit = dayOfMonth > 0 ? (filteredKpis.ganancias / dayOfMonth) * daysInMonth : filteredKpis.ganancias;

  // Operations status for pie chart
  const statusData: { name: string; value: number; color: string }[] = [
    { name: "Cerrada", value: cerradas, color: "#22c55e" },
    { name: "Abierta", value: abiertas, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // Bank balance chart data
  const bankData = useMemo(
    () => bancos
      .filter((b) => b.usdSaldo != null)
      .sort((a, b) => Math.abs(b.usdSaldo ?? 0) - Math.abs(a.usdSaldo ?? 0))
      .slice(0, 8)
      .map((b) => ({ name: b.cliente.length > 18 ? b.cliente.slice(0, 18) + "…" : b.cliente, saldo: b.usdSaldo ?? 0 })),
    [bancos]
  );

  function formatMonthLabel(key: string) {
    const [year, month] = key.split("-").map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard title="Ingresos / Egresos" value={formatCurrencyRound(filteredKpis.ingresos)} subtitle={`Egresos: ${formatCurrencyRound(filteredKpis.egresos)}`} icon={ArrowLeftRight} info="Ingresos: suma de importes de movimientos de entrada (col J donde col D tiene código). Egresos: suma de importes de salida (col J donde col E tiene código vinculante). Fuente: hoja Movimientos." />
        <KpiCard title="# Transacciones" value={totalTransacciones.toLocaleString()} icon={Hash} info="Cantidad total de movimientos en el período filtrado. Fuente: hoja Movimientos." />
        <KpiCard title="# Clientes" value={String(uniqueClientCount)} icon={Users} info="Cantidad de clientes únicos con operaciones en el período. Fuente: columna Cliente de hoja Operaciones." />
        <KpiCard title="Ganancias" value={formatCurrencyRound(filteredKpis.ganancias)} icon={TrendingUp} trend="up" info="Suma de comisiones cobradas (col M / cImpo) en movimientos de entrada. Fuente: hoja Movimientos." />
        <KpiCard title="Costos" value={formatCurrencyRound(filteredKpis.costos)} icon={Receipt} info="Suma del valor absoluto de costos de proveedor (col Q / dImpo). Un dImpo positivo = proveedor nos paga; negativo = nos cobra. Fuente: hoja Movimientos." />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Balance Bancos" value={formatCurrencyRound(totalBancos)} icon={Landmark} info="Suma de saldos USD de todos los bancos (excluye Mercury Cards). Fuente: hoja Cartera Bancos." />
        <KpiCard title="Cuentas x Cobrar" value={formatCurrencyRound(cuentasPorCobrar)} icon={Users} subtitle={`${clientesNosDeben.length} clientes`} info="Total que nos deben los clientes (saldo positivo en USD). Fuente: hoja Cartera Clientes." />
        <KpiCard title="Deudas" value={formatCurrencyRound(Math.abs(deudas))} icon={AlertCircle} trend="down" subtitle={`${clientesLesDebemos.length} clientes`} info="Total que debemos a clientes/proveedores (saldo negativo en USD). Fuente: hoja Cartera Clientes." />
        <KpiCard title="Op. Abiertas" value={`${abiertas} / ${filteredOps.length}`} subtitle={`${cerradas} cerradas`} trend={abiertas > 0 ? "down" : "neutral"} info="Una operación está cerrada cuando su código aparece en col D (entrada) y col E (salida) de Movimientos, y la diferencia ingreso−egreso ≈ comisión (±$1). Fuente: hoja Movimientos." />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm">
          <option value="all">Todos los meses</option>
          {availableMonths.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm">
          <option value="all">Todos los tipos</option>
          <option value="Income Wire">Income Wire</option>
          <option value="Outcome Wire">Outcome Wire</option>
          <option value="USDT">USDT</option>
          <option value="Nanocard">Nanocard</option>
          <option value="Cash To Cash">Cash To Cash</option>
          <option value="Intereses">Intereses</option>
        </select>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm max-w-[200px]">
          <option value="all">Todos los clientes</option>
          {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm">
          <option value="all">Todos los estados</option>
          <option value="CERRADO">Cerrada</option>
          <option value="ABIERTA">Abierta</option>
        </select>
      </div>

      {/* Row: Monthly Timeline (line chart) */}
      <ChartCard
        title="Evolución Mensual"
        info="Línea azul: cantidad de operaciones únicas por mes. Línea violeta: clientes únicos. Línea verde: ganancia total (cImpo). Eje Y izquierdo: cantidad. Eje Y derecho: USD. Fuente: hoja Movimientos + Operaciones."
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTimeline} margin={{ left: 5, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" fontSize={11} />
              <YAxis yAxisId="left" fontSize={11} tickFormatter={(v) => String(v)} label={{ value: "Cantidad", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#94a3b8" } }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tickFormatter={(v) => `$${formatCompactNumber(v)}`} label={{ value: "USD", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "#94a3b8" } }} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any, name: any) => {
                if (name === "Ganancia") return [formatCurrency(Number(v)), name];
                return [String(v), name];
              }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="Operaciones" stroke="#4285f4" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="left" type="monotone" dataKey="Clientes" stroke="#9c27b0" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="Ganancia" stroke="#34a853" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Row: Ganancias mes a mes + Ganancias gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Ganancias Mes a Mes"
          info="Ganancia total (suma de cImpo / col M) por cada mes. Aplican filtros de tipo y cliente. Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gananciasMensuales}>
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis tickFormatter={(v) => formatCompactNumber(v)} fontSize={11} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="ganancia" fill="#34a853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Ganancias gauge */}
        <ChartCard
          title="Ganancias vs Mejor Mes"
          info="Medidor de progreso: ganancias actuales vs objetivo (115% de las ganancias del mes según Dashboard). Estimado: proyección lineal de ganancias al fin de mes según ritmo actual. Fuente: hoja Movimientos + Dashboard."
        >
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="relative w-52 h-26">
              <svg viewBox="0 0 200 110" className="w-full h-full">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#overviewGaugeGradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${gananciaProgress * 2.51} 251`} />
                <defs><linearGradient id="overviewGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ea4335" /><stop offset="50%" stopColor="#fbbc04" /><stop offset="100%" stopColor="#34a853" /></linearGradient></defs>
                {(() => { const angle = Math.PI - (gananciaProgress / 100) * Math.PI; return <line x1="100" y1="100" x2={100 + 65 * Math.cos(angle)} y2={100 - 65 * Math.sin(angle)} stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />; })()}
                <circle cx="100" cy="100" r="5" fill="#4285f4" />
                <text x="20" y="108" fontSize="9" fill="#94a3b8" textAnchor="middle">0</text>
                <text x="180" y="108" fontSize="9" fill="#94a3b8" textAnchor="middle">{formatCompactNumber(bestMonthTarget)}</text>
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrencyRound(filteredKpis.ganancias)}</p>
              <p className="text-xs text-muted-foreground">{gananciaProgress.toFixed(0)}% del objetivo ({formatCurrencyRound(bestMonthTarget)})</p>
              <div className="pt-1 border-t">
                <p className={`text-base font-semibold ${estimatedProfit >= bestMonthTarget ? "text-emerald-600" : "text-amber-500"}`}>Estimado: {formatCurrencyRound(estimatedProfit)}</p>
                <p className="text-xs text-muted-foreground">Proyección fin de mes (día {dayOfMonth}/{daysInMonth})</p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row: Ganancia por producto + Margen por producto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Ganancia y Transacciones por Producto"
          info="Barras verdes: ganancia total (cImpo) por tipo de operación. Barras azules: cantidad de transacciones. Aplican filtros de mes/tipo/cliente. Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProductData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v, name) => [name === "ganancia" ? formatCurrency(Number(v)) : String(v), name === "ganancia" ? "Ganancia" : "Transacciones"]} />
                <Legend />
                <Bar dataKey="ganancia" name="Ganancia" fill="#34a853" radius={[0, 4, 4, 0]} />
                <Bar dataKey="transacciones" name="Transacciones" fill="#4285f4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Margen de Ganancia por Producto (%)"
          info="Porcentaje de ganancia respecto al importe total por tipo: (cImpo / importe) × 100. Indica cuánto margen generamos por cada tipo de operación. Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginByProduct} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v) => `${v}%`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => [`${v}%`, "Margen"]} />
                <Bar dataKey="margen" radius={[0, 4, 4, 0]}>
                  {marginByProduct.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row: % cobrado a clientes + Provider Dependency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Tasa de Comisión por Producto"
          subtitle="% que cobramos a clientes (comisión / importe)"
          info="Porcentaje que cobramos a clientes por tipo: (cImpo col M / importe col J) × 100. Muestra la tasa efectiva de comisión por producto. Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargeRateByType} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v) => `${v}%`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => [`${v}%`, "Tasa"]} />
                <Bar dataKey="tasa" radius={[0, 4, 4, 0]}>
                  {chargeRateByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Dependencia de Proveedores"
          subtitle="Ganancia vs Costo proveedor por tipo"
          info="Verde: nuestra ganancia (cImpo col M). Rojo: costo de proveedor (|dImpo| col Q). dImpo positivo = proveedor nos paga; negativo = nos cobra. Agrupado por tipo de operación. Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerDependency} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v, name) => [formatCurrency(Number(v)), name === "ganancia" ? "Ganancia" : "Costo proveedor"]} />
                <Legend />
                <Bar dataKey="ganancia" name="Ganancia" stackId="a" fill="#34a853" />
                <Bar dataKey="costo" name="Costo proveedor" stackId="a" fill="#ea4335" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row: Top Clients (recurrent + profitable) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Clientes Más Recurrentes"
          info="Top 10 clientes por cantidad de transacciones (movimientos de entrada). Aplican filtros activos. Fuente: hoja Movimientos + Operaciones."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRecurrentClients} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="transacciones" name="Transacciones" fill="#4285f4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Mejores Clientes (Mayor Ganancia)"
          info="Top 10 clientes por ganancia total generada (suma de cImpo). Aplican filtros activos. Fuente: hoja Movimientos + Operaciones."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProfitClients} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={11} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="ganancia" name="Ganancia" fill="#34a853" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row: Bank Balance + Operations Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Bancos por Saldo"
          info="Top 8 bancos por saldo USD (valor absoluto). Excluye Mercury Cards. Fuente: hoja Cartera Bancos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="saldo" radius={[0, 4, 4, 0]} fill="#4285f4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Estado de Operaciones"
          info="Operaciones cerradas vs abiertas. Cerrada: el código de op aparece en col D y col E de Movimientos, y la diferencia ingreso−egreso coincide con la comisión (±$1). Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={13}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />)}
                </Pie>
                <Legend fontSize={13} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
