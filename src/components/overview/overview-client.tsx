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
} from "recharts";
import { KpiCard } from "@/components/shared/kpi-card";
import { Operacion, Movimiento, CarteraBanco, CarteraCliente } from "@/types/sheets";
import { OPERATION_COLORS, STATUS_COLORS, MONTHS } from "@/lib/constants";
import {
  formatCurrency,
  formatCurrencyRound,
  formatCompactNumber,
  toDate,
} from "@/lib/utils";
import {
  DollarSign,
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
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.add(key);
      }
    });
    return [...months].sort().reverse();
  }, [movimientos]);

  // Derive operation closed/open status from movimientos
  // An op is CERRADO when: it has both inflows (op column) and outflows (vinculante column)
  // AND the difference between inflows and outflows ≈ comisiones (±1 tolerance for rounding)
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

  // Filtered operaciones (status filter uses movimientos-derived status)
  const filteredOps = useMemo(() => {
    return operaciones.filter((op) => {
      if (filterStatus !== "all") {
        const derived = opClosedMap.get(op.operacion) === true ? "CERRADO" : "ABIERTA";
        if (derived !== filterStatus) return false;
      }
      if (filterType !== "all" && getOpType(op.operacion) !== filterType)
        return false;
      if (filterClient !== "all" && op.cliente !== filterClient) return false;
      return true;
    });
  }, [operaciones, filterStatus, filterType, filterClient, opClosedMap]);

  // Filtered movimientos based on filters
  const filteredMovimientos = useMemo(() => {
    let result = movimientos;

    // Month filter
    if (filterMonth !== "all") {
      const [year, month] = filterMonth.split("-").map(Number);
      result = result.filter((m) => {
        const d = toDate(m.fecha);
        if (!d) return false;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }

    // Type/client filter via operation IDs
    if (filterType !== "all" || filterClient !== "all") {
      const opIds = new Set(filteredOps.map((o) => o.operacion));
      result = result.filter((m) => opIds.has(m.op));
    }

    return result;
  }, [movimientos, filteredOps, filterType, filterClient, filterMonth]);

  // KPI computations
  const totalTransacciones = filteredMovimientos.length;
  const uniqueClientCount = new Set(
    filteredOps.map((o) => o.cliente).filter(Boolean)
  ).size;

  // Compute KPIs from filteredMovimientos when any filter is active
  const filteredKpis = useMemo(() => {
    const anyFilterActive = filterMonth !== "all" || filterType !== "all" || filterClient !== "all";
    if (!anyFilterActive) return dashboardKpis;

    let ingresos = 0, egresos = 0, ganancias = 0, costos = 0;
    filteredMovimientos.forEach((m) => {
      const opCode = m.op?.trim();
      const vincCode = m.vinculante?.trim();
      if (opCode) {
        ingresos += m.importe ?? 0;
        ganancias += m.cImpo ?? 0;
        costos += Math.abs(m.dImpo ?? 0);
      }
      if (vincCode) {
        egresos += m.importe ?? 0;
      }
    });
    return { ingresos, egresos, ganancias, costos };
  }, [filteredMovimientos, dashboardKpis, filterMonth, filterType, filterClient]);

  // Bank totals
  const totalBancos = bancos.reduce((sum, b) => sum + (b.usdSaldo ?? 0), 0);

  // Client receivables/payables (filtered by client if selected)
  const filteredClientes = useMemo(() => {
    if (filterClient === "all") return clientes;
    return clientes.filter((c) => c.cliente === filterClient);
  }, [clientes, filterClient]);

  const clientesNosDeben = filteredClientes.filter((c) => (c.usdSaldo ?? 0) > 0);
  const clientesLesDebemos = filteredClientes.filter((c) => (c.usdSaldo ?? 0) < 0);
  const cuentasPorCobrar = clientesNosDeben.reduce(
    (sum, c) => sum + (c.usdSaldo ?? 0), 0
  );
  const deudas = clientesLesDebemos.reduce(
    (sum, c) => sum + (c.usdSaldo ?? 0), 0
  );

  // Operations counts using movimientos-derived status
  const cerradas = filteredOps.filter(
    (o) => opClosedMap.get(o.operacion) === true
  ).length;
  const abiertas = filteredOps.length - cerradas;

  // Provider dependency from movimientos: ganancia (cImpo col M) vs costo proveedor (dImpo col Q)
  // dImpo positive = provider pays us, negative = provider charges us
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
      .map(([name, v]) => ({
        name,
        ganancia: v.ganancia,
        costo: v.costo,
        color: OPERATION_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.ganancia + b.costo - (a.ganancia + a.costo));
  }, [filteredMovimientos]);

  // Ganancias gauge + estimated profit
  // Target stays unfiltered (overall month goal), but displayed value uses filteredKpis
  const bestMonthTarget = Math.max(dashboardKpis.ganancias * 1.15, 1);
  const gananciaProgress = Math.min(
    (filteredKpis.ganancias / bestMonthTarget) * 100,
    100
  );
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const estimatedProfit = dayOfMonth > 0
    ? (filteredKpis.ganancias / dayOfMonth) * daysInMonth
    : filteredKpis.ganancias;

  // Operations status for pie chart (using movimientos-derived status)
  const statusData = useMemo(() => {
    let cerradoCount = 0;
    let abiertaCount = 0;
    filteredOps.forEach((op) => {
      if (opClosedMap.get(op.operacion) === true) cerradoCount++;
      else abiertaCount++;
    });
    const result: { name: string; value: number; color: string }[] = [
      { name: "Cerrada", value: cerradoCount, color: STATUS_COLORS.CERRADO.bg },
      { name: "Abierta", value: abiertaCount, color: STATUS_COLORS.DEBE.bg },
    ].filter((d) => d.value > 0);
    return result;
  }, [filteredOps, opClosedMap]);

  // Bank balance chart data
  const bankData = useMemo(
    () =>
      bancos
        .filter((b) => b.usdSaldo != null)
        .sort((a, b) => Math.abs(b.usdSaldo ?? 0) - Math.abs(a.usdSaldo ?? 0))
        .slice(0, 8)
        .map((b) => ({
          name: b.cliente.length > 18 ? b.cliente.slice(0, 18) + "..." : b.cliente,
          saldo: b.usdSaldo ?? 0,
        })),
    [bancos]
  );

  // Format month label
  function formatMonthLabel(key: string) {
    const [year, month] = key.split("-").map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Ingresos / Egresos"
          value={formatCurrencyRound(filteredKpis.ingresos)}
          subtitle={`Egresos: ${formatCurrencyRound(filteredKpis.egresos)}`}
          icon={ArrowLeftRight}
        />
        <KpiCard
          title="# Transacciones"
          value={totalTransacciones.toLocaleString()}
          icon={Hash}
        />
        <KpiCard
          title="# Clientes"
          value={String(uniqueClientCount)}
          icon={Users}
        />
        <KpiCard
          title="Ganancias"
          value={formatCurrencyRound(filteredKpis.ganancias)}
          icon={TrendingUp}
          trend="up"
        />
        <KpiCard
          title="Costos"
          value={formatCurrencyRound(filteredKpis.costos)}
          icon={Receipt}
        />
      </div>

      {/* KPI Cards - Row 2: Balance & Portfolio */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Balance Bancos"
          value={formatCurrencyRound(totalBancos)}
          icon={Landmark}
        />
        <KpiCard
          title="Cuentas x Cobrar"
          value={formatCurrencyRound(cuentasPorCobrar)}
          icon={Users}
          subtitle={`${clientesNosDeben.length} clientes`}
        />
        <KpiCard
          title="Deudas"
          value={formatCurrencyRound(Math.abs(deudas))}
          icon={AlertCircle}
          trend="down"
          subtitle={`${clientesLesDebemos.length} clientes`}
        />
        <KpiCard
          title="Op. Abiertas"
          value={`${abiertas} / ${filteredOps.length}`}
          subtitle={`${cerradas} cerradas`}
          trend={abiertas > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todos los meses</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todos los tipos</option>
          <option value="Income Wire">Income Wire</option>
          <option value="Outcome Wire">Outcome Wire</option>
          <option value="USDT">USDT</option>
          <option value="Nanocard">Nanocard</option>
          <option value="Cash To Cash">Cash To Cash</option>
          <option value="Intereses">Intereses</option>
        </select>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm max-w-[200px]"
        >
          <option value="all">Todos los clientes</option>
          {uniqueClients.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="CERRADO">Cerrada</option>
          <option value="ABIERTA">Abierta</option>
        </select>
      </div>

      {/* Charts Row 1: Provider Dependency + Ganancias Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Dependency: Ganancia vs Costos ratio */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Dependencia de Proveedores
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Ganancia vs Costo por tipo — si fueramos nuestros propios proveedores
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={providerDependency}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactNumber(v)}
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                />
                <Tooltip
                  formatter={(v, name) =>
                    [formatCurrency(Number(v)), name === "ganancia" ? "Ganancia" : "Costo proveedor"]
                  }
                />
                <Legend />
                <Bar
                  dataKey="ganancia"
                  name="Ganancia"
                  stackId="a"
                  fill="#34a853"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="costo"
                  name="Costo proveedor"
                  stackId="a"
                  fill="#ea4335"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ganancias vs Target Gauge */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Ganancias vs Mejor Mes
          </h3>
          <div className="flex flex-col items-center justify-center h-72 gap-4">
            <div className="relative w-56 h-28">
              <svg viewBox="0 0 200 110" className="w-full h-full">
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#overviewGaugeGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${gananciaProgress * 2.51} 251`}
                />
                <defs>
                  <linearGradient
                    id="overviewGaugeGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#ea4335" />
                    <stop offset="50%" stopColor="#fbbc04" />
                    <stop offset="100%" stopColor="#34a853" />
                  </linearGradient>
                </defs>
                {(() => {
                  const angle = Math.PI - (gananciaProgress / 100) * Math.PI;
                  const nx = 100 + 65 * Math.cos(angle);
                  const ny = 100 - 65 * Math.sin(angle);
                  return (
                    <line
                      x1="100"
                      y1="100"
                      x2={nx}
                      y2={ny}
                      stroke="#1f2937"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  );
                })()}
                <circle cx="100" cy="100" r="5" fill="#4285f4" />
                <text x="20" y="108" fontSize="9" fill="#94a3b8" textAnchor="middle">
                  0
                </text>
                <text x="180" y="108" fontSize="9" fill="#94a3b8" textAnchor="middle">
                  {formatCompactNumber(bestMonthTarget)}
                </text>
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrencyRound(filteredKpis.ganancias)}
              </p>
              <p className="text-xs text-muted-foreground">
                {gananciaProgress.toFixed(0)}% del objetivo ({formatCurrencyRound(bestMonthTarget)})
              </p>
              <div className="pt-2 border-t mt-2">
                <p className={`text-lg font-semibold ${estimatedProfit >= bestMonthTarget ? "text-emerald-600" : "text-amber-500"}`}>
                  Estimado: {formatCurrencyRound(estimatedProfit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Proyección fin de mes (día {dayOfMonth}/{daysInMonth})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Bank Balance + Operations Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Balance */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Top Bancos por Saldo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData} layout="vertical" margin={{ left: 10 }}>
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactNumber(v)}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="saldo" radius={[0, 4, 4, 0]} fill="#4285f4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operations Status */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Estado de Operaciones
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                  fontSize={12}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Legend fontSize={12} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
