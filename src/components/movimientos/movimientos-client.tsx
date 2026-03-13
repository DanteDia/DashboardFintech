"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
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
import { Movimiento } from "@/types/sheets";
import { formatCurrency, formatDate, formatCompactNumber, toDate } from "@/lib/utils";
import { ChartCard } from "@/components/shared/info-tooltip";

// Estado colors (column F values: ok, pendiente, borrador, anulado)
const ESTADO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ok: { bg: "#d4edda", text: "#155724", label: "Ok" },
  pendiente: { bg: "#fff3cd", text: "#856404", label: "Pendiente" },
  borrador: { bg: "#cce5ff", text: "#004085", label: "Borrador" },
  anulado: { bg: "#f8d7da", text: "#721c24", label: "Anulado" },
};

function EstadoBadge({ estado }: { estado: string }) {
  const normalized = estado.toLowerCase().trim();
  const config = ESTADO_COLORS[normalized];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        {estado || "-"}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

interface MovimientosClientProps {
  movimientos: Movimiento[];
}

export function MovimientosClient({ movimientos }: MovimientosClientProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");

  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      if (filterType !== "all" && m.tipo !== filterType) return false;
      if (filterEstado !== "all") {
        const est = m.estado.toLowerCase().trim();
        if (est !== filterEstado) return false;
      }
      return true;
    });
  }, [movimientos, filterType, filterEstado]);

  // Unique types
  const types = useMemo(
    () => [...new Set(movimientos.map((m) => m.tipo).filter(Boolean))].sort(),
    [movimientos]
  );

  // Daily volume - sort by timestamp, display as DD/MM Argentine format
  const dailyVolume = useMemo(() => {
    const map: Record<string, { value: number; ts: number; day: number; month: number }> = {};
    movimientos.forEach((m) => {
      const d = toDate(m.fecha);
      if (!d || isNaN(d.getTime())) return;
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      // Use YYYY-MM-DD as internal key for grouping
      const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (!map[key]) map[key] = { value: 0, ts: d.getTime(), day, month };
      map[key].value += Math.abs(m.importe ?? 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { value, day, month }]) => ({
        date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
        value,
      }));
  }, [movimientos]);

  // Estado stats (column F)
  const estadoStats = useMemo(() => {
    const counts: Record<string, number> = {};
    movimientos.forEach((m) => {
      const est = m.estado.toLowerCase().trim() || "sin estado";
      counts[est] = (counts[est] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      ok: "#22c55e",
      pendiente: "#f59e0b",
      borrador: "#3b82f6",
      anulado: "#ef4444",
      "sin estado": "#94a3b8",
    };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colorMap[name] || "#94a3b8",
      }))
      .filter((d) => d.value > 0);
  }, [movimientos]);

  const columns: Column<Movimiento>[] = [
    {
      key: "fecha",
      header: "Fecha",
      accessor: (r) => toDate(r.fecha)?.getTime() ?? 0,
      render: (r) => formatDate(r.fecha),
    },
    {
      key: "op",
      header: "Op",
      accessor: (r) => r.op,
      render: (r) => <span className="font-mono text-xs">{r.op}</span>,
    },
    { key: "tipo", header: "Tipo", accessor: (r) => r.tipo },
    { key: "origen", header: "Origen", accessor: (r) => r.origen },
    { key: "destino", header: "Destino", accessor: (r) => r.destino },
    {
      key: "importe",
      header: "Importe",
      accessor: (r) => r.importe,
      render: (r) => formatCurrency(r.importe),
      align: "right",
    },
    { key: "moneda", header: "Mon", accessor: (r) => r.moneda },
    {
      key: "cImpo",
      header: "Comision",
      accessor: (r) => r.cImpo,
      render: (r) => formatCurrency(r.cImpo),
      align: "right",
    },
    {
      key: "estado",
      header: "Estado",
      accessor: (r) => r.estado,
      render: (r) => <EstadoBadge estado={r.estado} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Charts ABOVE the table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Volumen Diario"
          info="Volumen de importe (valor absoluto) por día. Muestra la suma de |importe| (col J) para cada fecha. Fuente: hoja Movimientos."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyVolume}>
                <XAxis dataKey="date" fontSize={10} tick={{ fill: "#64748b" }} />
                <YAxis tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4285f4"
                  fill="#4285f4"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Estado de Movimientos"
          info="Distribución de movimientos por estado (col F): Ok, Pendiente, Borrador, Anulado. Fuente: hoja Movimientos columna F."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadoStats}
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
                  {estadoStats.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todos los tipos</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="ok">Ok</option>
          <option value="pendiente">Pendiente</option>
          <option value="borrador">Borrador</option>
          <option value="anulado">Anulado</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        pageSize={50}
        searchable
        searchPlaceholder="Buscar por operacion, origen o destino..."
        searchFn={(row, q) =>
          row.op.toLowerCase().includes(q) ||
          row.origen.toLowerCase().includes(q) ||
          row.destino.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
