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
import { OPERATION_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";

interface OperacionesClientProps {
  operaciones: Operacion[];
  movimientos: Movimiento[];
}

export function OperacionesClient({
  operaciones,
  movimientos,
}: OperacionesClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Determine operation type from prefix
  function getOpType(op: string): string {
    if (op.startsWith("INC-")) return "Income Wire";
    if (op.startsWith("OUT-")) return "Outcome Wire";
    if (op.startsWith("USD-")) return "USDT";
    if (op.startsWith("NAN-")) return "Nanocard";
    if (op.startsWith("CTC-")) return "Cash To Cash";
    if (op.startsWith("INT-")) return "Intereses";
    return "Otro";
  }

  const filteredOps = useMemo(() => {
    return operaciones.filter((op) => {
      if (filterStatus !== "all" && op.cierre.toUpperCase().trim() !== filterStatus)
        return false;
      if (filterType !== "all" && getOpType(op.operacion) !== filterType)
        return false;
      return true;
    });
  }, [operaciones, filterStatus, filterType]);

  // Volume by type
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
      accessor: (r) => r.cierre,
      render: (r) => <StatusBadge status={r.cierre} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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
          const s = row.cierre.toUpperCase().trim();
          if (s === "DEBE") return "bg-[#fff3cd]/30";
          if (s === "DEBEMOS") return "bg-[#f8d7da]/30";
          return "";
        }}
      />

      {/* Charts */}
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
              <BarChart data={topClients} layout="vertical" margin={{ left: 10 }}>
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
                <Bar dataKey="comision" fill="#34a853" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
