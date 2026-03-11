"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DataTable, Column } from "@/components/shared/data-table";
import { CarteraCliente } from "@/types/sheets";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import { TrendingUp, TrendingDown, Users } from "lucide-react";

interface ClientesClientProps {
  clientes: CarteraCliente[];
}

export function ClientesClient({ clientes }: ClientesClientProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filterType === "all") return clientes;
    return clientes.filter(
      (c) => c.tipo?.toLowerCase() === filterType.toLowerCase()
    );
  }, [clientes, filterType]);

  const clientesOnly = clientes.filter(
    (c) => c.tipo?.toLowerCase() === "cliente"
  );
  const porCobrar = clientesOnly
    .filter((c) => (c.usdSaldo ?? 0) > 0)
    .reduce((sum, c) => sum + (c.usdSaldo ?? 0), 0);
  const deudas = clientesOnly
    .filter((c) => (c.usdSaldo ?? 0) < 0)
    .reduce((sum, c) => sum + Math.abs(c.usdSaldo ?? 0), 0);

  const topDeudores = useMemo(
    () =>
      clientesOnly
        .filter((c) => (c.usdSaldo ?? 0) > 0)
        .sort((a, b) => (b.usdSaldo ?? 0) - (a.usdSaldo ?? 0))
        .slice(0, 10)
        .map((c) => ({
          name:
            c.cliente.length > 20
              ? c.cliente.slice(0, 20) + "..."
              : c.cliente,
          saldo: c.usdSaldo ?? 0,
        })),
    [clientesOnly]
  );

  const topAcreedores = useMemo(
    () =>
      clientesOnly
        .filter((c) => (c.usdSaldo ?? 0) < 0)
        .sort((a, b) => (a.usdSaldo ?? 0) - (b.usdSaldo ?? 0))
        .slice(0, 10)
        .map((c) => ({
          name:
            c.cliente.length > 20
              ? c.cliente.slice(0, 20) + "..."
              : c.cliente,
          saldo: Math.abs(c.usdSaldo ?? 0),
        })),
    [clientesOnly]
  );

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
          subtitle={`${clientesOnly.filter((c) => (c.usdSaldo ?? 0) > 0).length} clientes`}
        />
        <KpiCard
          title="Deudas (les debemos)"
          value={formatCurrency(deudas)}
          icon={TrendingDown}
          trend="down"
          subtitle={`${clientesOnly.filter((c) => (c.usdSaldo ?? 0) < 0).length} clientes`}
        />
        <KpiCard
          title="Total Clientes"
          value={String(clientesOnly.length)}
          icon={Users}
        />
      </div>

      {/* Filter */}
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="px-3 py-2 rounded-lg border bg-background text-sm"
      >
        <option value="all">Todos</option>
        <option value="cliente">Clientes</option>
        <option value="banco">Bancos</option>
      </select>

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Top Deudores (nos deben)
          </h3>
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
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Top Acreedores (les debemos)
          </h3>
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
        </div>
      </div>
    </div>
  );
}
