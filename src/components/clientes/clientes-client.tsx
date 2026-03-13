"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DataTable, Column } from "@/components/shared/data-table";
import { CarteraCliente, Movimiento } from "@/types/sheets";
import { formatCurrency, formatCompactNumber, toDate } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/info-tooltip";
import { TrendingUp, TrendingDown, Users } from "lucide-react";

interface ClientesClientProps {
  clientes: CarteraCliente[];
  movimientos: Movimiento[];
}

const AGING_BUCKETS = [
  { key: "≤ 1 semana", maxDays: 7 },
  { key: "1-2 semanas", maxDays: 14 },
  { key: "> 2 semanas", maxDays: Infinity },
] as const;

function debtAgingLabel(days: number): string {
  for (const b of AGING_BUCKETS) {
    if (days <= b.maxDays) return b.key;
  }
  return "> 2 semanas";
}

function debtAgingColor(days: number): string {
  if (days <= 7) return "bg-emerald-100 text-emerald-700";
  if (days <= 14) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export function ClientesClient({ clientes, movimientos }: ClientesClientProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAging, setFilterAging] = useState<string>("all");

  // Debt aging: find last movimiento date per client and compute days since
  const clientDebtAging = useMemo(() => {
    const now = new Date();
    const lastMovDate: Record<string, Date> = {};
    movimientos.forEach((m) => {
      const d = toDate(m.fecha);
      if (!d) return;
      const names = [m.origen, m.destino].filter(Boolean);
      names.forEach((name) => {
        if (!lastMovDate[name] || d > lastMovDate[name]) {
          lastMovDate[name] = d;
        }
      });
    });
    const map: Record<string, number> = {};
    clientes.forEach((c) => {
      const last = lastMovDate[c.cliente];
      if (last) {
        map[c.cliente] = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        map[c.cliente] = 999;
      }
    });
    return map;
  }, [clientes, movimientos]);

  // Apply both type and aging filters
  const filtered = useMemo(() => {
    let result = clientes;
    if (filterType !== "all") {
      result = result.filter((c) => c.tipo?.toLowerCase() === filterType.toLowerCase());
    }
    if (filterAging !== "all") {
      result = result.filter((c) => {
        if ((c.usdSaldo ?? 0) <= 0) return false;
        const days = clientDebtAging[c.cliente] ?? 999;
        return debtAgingLabel(days) === filterAging;
      });
    }
    return result;
  }, [clientes, filterType, filterAging, clientDebtAging]);

  // Use ALL clients for KPIs (unless aging filter active)
  const relevantClientes = filterAging !== "all" ? filtered : clientes;
  const nosDeben = relevantClientes.filter((c) => (c.usdSaldo ?? 0) > 0);
  const lesDebemos = relevantClientes.filter((c) => (c.usdSaldo ?? 0) < 0);

  const porCobrar = nosDeben.reduce((sum, c) => sum + (c.usdSaldo ?? 0), 0);
  const deudas = lesDebemos.reduce((sum, c) => sum + Math.abs(c.usdSaldo ?? 0), 0);

  // Aging distribution for debtors (always computed from all clients)
  const agingDistribution = useMemo(() => {
    const allDebtors = clientes.filter((c) => (c.usdSaldo ?? 0) > 0);
    const buckets: Record<string, { count: number; total: number }> = {};
    for (const b of AGING_BUCKETS) {
      buckets[b.key] = { count: 0, total: 0 };
    }
    allDebtors.forEach((c) => {
      const days = clientDebtAging[c.cliente] ?? 999;
      const label = debtAgingLabel(days);
      buckets[label].count++;
      buckets[label].total += c.usdSaldo ?? 0;
    });
    return Object.entries(buckets)
      .filter(([, v]) => v.count > 0)
      .map(([name, v]) => ({ name, clientes: v.count, monto: Math.round(v.total) }));
  }, [clientes, clientDebtAging]);

  const topDeudores = useMemo(
    () =>
      nosDeben
        .sort((a, b) => (b.usdSaldo ?? 0) - (a.usdSaldo ?? 0))
        .slice(0, 10)
        .map((c) => ({
          name: c.cliente.length > 20 ? c.cliente.slice(0, 20) + "..." : c.cliente,
          saldo: c.usdSaldo ?? 0,
        })),
    [nosDeben]
  );

  const topAcreedores = useMemo(
    () =>
      lesDebemos
        .sort((a, b) => (a.usdSaldo ?? 0) - (b.usdSaldo ?? 0))
        .slice(0, 10)
        .map((c) => ({
          name: c.cliente.length > 20 ? c.cliente.slice(0, 20) + "..." : c.cliente,
          saldo: Math.abs(c.usdSaldo ?? 0),
        })),
    [lesDebemos]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAgingBarClick = (data: any) => {
    if (data && data.activeLabel) {
      setFilterAging((prev) => (prev === data.activeLabel ? "all" : data.activeLabel));
    }
  };

  const columns: Column<CarteraCliente>[] = [
    { key: "cliente", header: "Cliente", accessor: (r) => r.cliente },
    { key: "tipo", header: "Tipo", accessor: (r) => r.tipo },
    {
      key: "saldoInicial",
      header: "Saldo Inicial",
      accessor: (r) => r.saldoInicial,
      render: (r) => formatCurrency(r.saldoInicial),
      align: "right",
    },
    {
      key: "usdMov",
      header: "Movimientos",
      accessor: (r) => r.usdMov,
      render: (r) => formatCurrency(r.usdMov),
      align: "right",
    },
    {
      key: "usdSaldo",
      header: "Saldo",
      accessor: (r) => r.usdSaldo,
      render: (r) => (
        <span
          className={
            (r.usdSaldo ?? 0) > 0
              ? "text-emerald-600 font-medium"
              : (r.usdSaldo ?? 0) < 0
              ? "text-red-500 font-medium"
              : ""
          }
        >
          {formatCurrency(r.usdSaldo)}
        </span>
      ),
      align: "right",
    },
    {
      key: "aging",
      header: "Antigüedad",
      accessor: (r) => clientDebtAging[r.cliente] ?? 999,
      render: (r) => {
        const days = clientDebtAging[r.cliente] ?? 999;
        if ((r.usdSaldo ?? 0) <= 0) return <span className="text-xs text-muted-foreground">-</span>;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${debtAgingColor(days)}`}>
            {debtAgingLabel(days)}
          </span>
        );
      },
    },
    {
      key: "pendiente",
      header: "Pendiente",
      accessor: (r) => r.pendiente,
      render: (r) => formatCurrency(r.pendiente),
      align: "right",
    },
    {
      key: "comentario",
      header: "Comentario",
      accessor: (r) => r.comentario,
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Cuentas por Cobrar"
          value={formatCurrency(porCobrar)}
          icon={TrendingUp}
          trend="up"
          subtitle={`${nosDeben.length} clientes`}
          info="Total que nos deben (clientes con saldo positivo USD). Fuente: hoja Cartera Clientes."
        />
        <KpiCard
          title="Deudas (les debemos)"
          value={formatCurrency(deudas)}
          icon={TrendingDown}
          trend="down"
          subtitle={`${lesDebemos.length} clientes`}
          info="Total que debemos a clientes/proveedores (saldo negativo USD). Fuente: hoja Cartera Clientes."
        />
        <KpiCard
          title="Total Clientes"
          value={String(clientes.length)}
          icon={Users}
          info="Cantidad total de clientes/proveedores/bancos en la cartera. Fuente: hoja Cartera Clientes."
        />
      </div>

      {/* Charts ABOVE the table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Top Deudores (nos deben)"
          info="Top 10 clientes que nos deben más dinero, ordenados por saldo USD descendente. Fuente: hoja Cartera Clientes."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDeudores} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <YAxis type="category" dataKey="name" width={140} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="saldo" fill="#34a853" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Top Acreedores (les debemos)"
          info="Top 10 clientes/proveedores a quienes más debemos, ordenados por saldo USD. Fuente: hoja Cartera Clientes."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAcreedores} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <YAxis type="category" dataKey="name" width={140} fontSize={11} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="saldo" fill="#ea4335" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Antigüedad de Deudas"
          subtitle={filterAging !== "all" ? `Filtro: ${filterAging} (click para quitar)` : "Click en barra para filtrar"}
          info="Distribución de clientes que nos deben según hace cuánto fue su último movimiento. Clickeá una barra para filtrar tabla y gráficos. Fuente: hoja Movimientos + Cartera Clientes."
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingDistribution} layout="vertical" margin={{ left: 10 }} onClick={handleAgingBarClick} style={{ cursor: "pointer" }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} tick={{ fill: "#64748b" }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(v: any, name: any) => [name === "monto" ? formatCurrency(Number(v)) : String(v), name === "monto" ? "Monto" : "Clientes"]} />
                <Bar dataKey="monto" name="Monto" radius={[0, 4, 4, 0]}>
                  {agingDistribution.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={filterAging === "all" || filterAging === entry.name ? "#f59e0b" : "#e5e7eb"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todos</option>
          <option value="cliente">Clientes</option>
          <option value="banco">Bancos</option>
        </select>
        {filterAging !== "all" && (
          <button
            onClick={() => setFilterAging("all")}
            className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium flex items-center gap-1.5 hover:bg-amber-200 transition-colors"
          >
            Antigüedad: {filterAging}
            <span className="text-amber-600">✕</span>
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        pageSize={30}
        searchable
        searchPlaceholder="Buscar cliente..."
        searchFn={(row, q) => row.cliente.toLowerCase().includes(q)}
        rowClassName={(row) => {
          const saldo = row.usdSaldo ?? 0;
          if (saldo > 0) return "bg-[#d5f4e6]/20";
          if (saldo < 0) return "bg-[#ffeaa7]/20";
          return "";
        }}
      />
    </div>
  );
}
