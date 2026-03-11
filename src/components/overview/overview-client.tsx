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
import { OPERATION_COLORS, STATUS_COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatCurrencyRound,
  formatCompactNumber,
} from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Hash,
  Users,
  Receipt,
  Landmark,
  AlertCircle,
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

  // Unique values for filters
  const uniqueClients = useMemo(
    () => [...new Set(operaciones.map((o) => o.cliente).filter(Boolean))].sort(),
    [operaciones]
  );

  // Filtered operaciones
  const filteredOps = useMemo(() => {
    return operaciones.filter((op) => {
      if (filterStatus !== "all" && op.cierre.toUpperCase().trim() !== filterStatus)
        return false;
      if (filterType !== "all" && getOpType(op.operacion) !== filterType)
        return false;
      if (filterClient !== "all" && op.cliente !== filterClient) return false;
      return true;
    });
  }, [operaciones, filterStatus, filterType, filterClient]);

  // Filtered movimientos based on operation type filter
  const filteredMovimientos = useMemo(() => {
    if (filterType === "all" && filterClient === "all") return movimientos;
    // Get matching operation IDs from filtered ops
    const opIds = new Set(filteredOps.map((o) => o.operacion));
    return movimientos.filter((m) => opIds.has(m.op));
  }, [movimientos, filteredOps, filterType, filterClient]);

  // KPI computations
  const totalTransacciones = filteredMovimientos.length;
  const uniqueClientCount = new Set(
    filteredOps.map((o) => o.cliente).filter(Boolean)
  ).size;
  const margenBruto =
    dashboardKpis.costos > 0
      ? ((dashboardKpis.ganancias / dashboardKpis.costos) * 100).toFixed(2)
      : "0";

  // Bank totals
  const totalBancos = bancos.reduce((sum, b) => sum + (b.usdSaldo ?? 0), 0);

  // Client receivables/payables
  const clientesNosDeben = clientes.filter((c) => (c.usdSaldo ?? 0) > 0);
  const clientesLesDebemos = clientes.filter((c) => (c.usdSaldo ?? 0) < 0);
  const cuentasPorCobrar = clientesNosDeben.reduce(
    (sum, c) => sum + (c.usdSaldo ?? 0), 0
  );
  const deudas = clientesLesDebemos.reduce(
    (sum, c) => sum + (c.usdSaldo ?? 0), 0
  );

  // Operations counts
  const cerradas = filteredOps.filter(
    (o) => o.cierre.toUpperCase().trim() === "CERRADO"
  ).length;
  const abiertas = filteredOps.length - cerradas;

  // Provider dependency: costs by operation type as % of total egresos
  const providerDependency = useMemo(() => {
    const costByType: Record<string, number> = {};
    filteredOps.forEach((op) => {
      const tipo = getOpType(op.operacion);
      costByType[tipo] = (costByType[tipo] || 0) + Math.abs(op.egreso ?? 0);
    });
    const total = Object.values(costByType).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return Object.entries(costByType)
      .map(([name, value]) => ({
        name,
        value,
        pct: ((value / total) * 100).toFixed(1),
        color: OPERATION_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOps]);

  // Income gauge
  const bestMonthTarget = Math.max(dashboardKpis.ingresos * 1.15, 1);
  const incomeProgress = Math.min(
    (dashboardKpis.ingresos / bestMonthTarget) * 100,
    100
  );

  // Operations status for pie chart
  const statusData = useMemo(() => {
    const counts = filteredOps.reduce(
      (acc, op) => {
        const key = op.cierre.toUpperCase().trim();
        if (key === "CERRADO") acc.cerrado++;
        else if (key === "DEBE") acc.debe++;
        else if (key === "DEBEMOS") acc.debemos++;
        else acc.otros++;
        return acc;
      },
      { cerrado: 0, debe: 0, debemos: 0, otros: 0 }
    );
    const result: { name: string; value: number; color: string }[] = [
      { name: "Cerrado", value: counts.cerrado, color: STATUS_COLORS.CERRADO.bg },
      { name: "Debe", value: counts.debe, color: STATUS_COLORS.DEBE.bg },
      { name: "Debemos", value: counts.debemos, color: STATUS_COLORS.DEBEMOS.bg },
    ].filter((d) => d.value > 0);
    if (counts.otros > 0) {
      result.push({ name: "Otros", value: counts.otros, color: "#e2e8f0" });
    }
    return result;
  }, [filteredOps]);

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

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1: Looker style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard
          title="Ingresos"
          value={formatCurrencyRound(dashboardKpis.ingresos)}
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="Margen Bruto"
          value={`${margenBruto}%`}
          subtitle="Ganancias vs Costos"
          icon={TrendingUp}
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
          title="Egresos"
          value={formatCurrencyRound(dashboardKpis.egresos)}
          icon={TrendingDown}
        />
        <KpiCard
          title="Ganancias"
          value={formatCurrencyRound(dashboardKpis.ganancias)}
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="Costos"
          value={formatCurrencyRound(dashboardKpis.costos)}
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
          <option value="CERRADO">Cerrado</option>
          <option value="DEBE">Debe</option>
          <option value="DEBEMOS">Debemos</option>
        </select>
      </div>

      {/* Charts Row 1: Provider Dependency + Income Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Dependency Donut */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Dependencia de Proveedores (Costos por Tipo)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerDependency}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ pct }) => `${pct}%`}
                  labelLine={false}
                  fontSize={12}
                >
                  {providerDependency.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Target Gauge */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Ingresos vs Mejor Mes
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
                  strokeDasharray={`${incomeProgress * 2.51} 251`}
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
                  const angle = Math.PI - (incomeProgress / 100) * Math.PI;
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
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                {formatCurrencyRound(dashboardKpis.ingresos)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {incomeProgress.toFixed(0)}% del objetivo
              </p>
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
