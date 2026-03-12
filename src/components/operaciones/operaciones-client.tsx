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
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Operacion, Movimiento } from "@/types/sheets";
import { OPERATION_COLORS } from "@/lib/constants";
import {
  formatCurrency,
  formatCurrencyRound,
  formatCompactNumber,
} from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  DollarSign,
  TrendingUp,
  Hash,
  Users,
  TrendingDown,
  Receipt,
} from "lucide-react";

interface DashboardKpis {
  ingresos: number;
  egresos: number;
  costos: number;
  ganancias: number;
}

interface OperacionesClientProps {
  operaciones: Operacion[];
  movimientos: Movimiento[];
  dashboardKpis: DashboardKpis;
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

export function OperacionesClient({
  operaciones,
  movimientos,
  dashboardKpis,
}: OperacionesClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");

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

  // Helper to get derived status for an operation
  function getDerivedStatus(op: Operacion): string {
    return opClosedMap.get(op.operacion) === true ? "CERRADO" : "ABIERTA";
  }

  // Unique clients for filter
  const uniqueClients = useMemo(
    () =>
      [...new Set(operaciones.map((o) => o.cliente).filter(Boolean))].sort(),
    [operaciones]
  );

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

  // KPI computations
  const totalTransacciones = movimientos.length;
  const uniqueClientCount = new Set(
    operaciones.map((o) => o.cliente).filter(Boolean)
  ).size;
  const margenBruto =
    dashboardKpis.costos > 0
      ? ((dashboardKpis.ganancias / dashboardKpis.costos) * 100).toFixed(2)
      : "0";

  // Provider dependency: costs by operation type as % of total egresos
  const providerDependency = useMemo(() => {
    const costByType: Record<string, number> = {};
    operaciones.forEach((op) => {
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
  }, [operaciones]);

  // Volume by type (pie)
  const volumeByType = useMemo(() => {
    const map: Record<string, number> = {};
    operaciones.forEach((op) => {
      const tipo = getOpType(op.operacion);
      map[tipo] = (map[tipo] || 0) + (op.ingreso ?? 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        color: OPERATION_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [operaciones]);

  // Top 10 clients by commission
  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    operaciones.forEach((op) => {
      if (op.cliente && op.comision != null) {
        map[op.cliente] = (map[op.cliente] || 0) + op.comision;
      }
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 20 ? name.slice(0, 20) + "..." : name,
        comision: value,
      }));
  }, [operaciones]);

  // Income gauge: current vs target (115% of current as aspiration)
  const bestMonthTarget = Math.max(dashboardKpis.ingresos * 1.15, 1);
  const incomeProgress = Math.min(
    (dashboardKpis.ingresos / bestMonthTarget) * 100,
    100
  );

  const columns: Column<Operacion>[] = [
    {
      key: "operacion",
      header: "Operacion",
      accessor: (r) => r.operacion,
      render: (r) => (
        <span className="font-mono text-xs">{r.operacion}</span>
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      accessor: (r) => r.cliente,
    },
    {
      key: "ingreso",
      header: "Ingreso",
      accessor: (r) => r.ingreso,
      render: (r) => formatCurrency(r.ingreso),
      align: "right",
    },
    {
      key: "egreso",
      header: "Egreso",
      accessor: (r) => r.egreso,
      render: (r) => formatCurrency(r.egreso),
      align: "right",
    },
    {
      key: "comision",
      header: "Comision",
      accessor: (r) => r.comision,
      render: (r) => (
        <span className="font-medium text-emerald-600">
          {formatCurrency(r.comision)}
        </span>
      ),
      align: "right",
    },
    {
      key: "diferencia",
      header: "Dif.",
      accessor: (r) => r.diferencia,
      render: (r) => formatCurrency(r.diferencia),
      align: "right",
    },
    {
      key: "cierre",
      header: "Estado",
      accessor: (r) => getDerivedStatus(r),
      render: (r) => <StatusBadge status={getDerivedStatus(r)} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
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
          <option value="CERRADO">Cerrada</option>
          <option value="ABIERTA">Abierta</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={filteredOps}
        columns={columns}
        pageSize={30}
        searchable
        searchPlaceholder="Buscar por operacion o cliente..."
        searchFn={(row, q) =>
          row.operacion.toLowerCase().includes(q) ||
          row.cliente.toLowerCase().includes(q)
        }
        rowClassName={(row) => {
          const closed = opClosedMap.get(row.operacion) === true;
          return closed ? "" : "bg-[#fff3cd]/20";
        }}
      />

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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => `${props.pct}%`}
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
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                />
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
            {/* Gauge visualization */}
            <div className="relative w-56 h-28">
              <svg viewBox="0 0 200 110" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${incomeProgress * 2.51} 251`}
                />
                {/* Gradient */}
                <defs>
                  <linearGradient
                    id="gaugeGradient"
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
                {/* Needle */}
                {(() => {
                  const angle =
                    Math.PI - (incomeProgress / 100) * Math.PI;
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
                {/* Center dot */}
                <circle cx="100" cy="100" r="5" fill="#4285f4" />
                {/* Labels */}
                <text
                  x="20"
                  y="108"
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  0
                </text>
                <text
                  x="180"
                  y="108"
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
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

      {/* Charts Row 2: Volume + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by type */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Volumen por Tipo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={volumeByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name }) => name}
                  labelLine={false}
                  fontSize={11}
                >
                  {volumeByType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top clients by commission */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Top 10 Clientes por Comision
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClients}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactNumber(v)}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar
                  dataKey="comision"
                  fill="#34a853"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
