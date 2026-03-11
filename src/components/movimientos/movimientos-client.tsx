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
import { VerificationBadge } from "@/components/shared/status-badge";
import { Movimiento } from "@/types/sheets";
import { VERIFICATION_COLORS } from "@/lib/constants";
import { formatCurrency, formatDate, formatCompactNumber, toDate } from "@/lib/utils";

interface MovimientosClientProps {
  movimientos: Movimiento[];
}

export function MovimientosClient({ movimientos }: MovimientosClientProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterV1, setFilterV1] = useState<string>("all");

  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      if (filterType !== "all" && m.tipo !== filterType) return false;
      if (filterV1 !== "all" && m.v1.toUpperCase().trim() !== filterV1)
        return false;
      return true;
    });
  }, [movimientos, filterType, filterV1]);

  // Unique types
  const types = useMemo(
    () => [...new Set(movimientos.map((m) => m.tipo).filter(Boolean))].sort(),
    [movimientos]
  );

  // Daily volume
  const dailyVolume = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.forEach((m) => {
      const d = toDate(m.fecha);
      if (d) {
        const key = d.toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + Math.abs(m.importe ?? 0);
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }, [movimientos]);

  // Verification stats
  const verifStats = useMemo(() => {
    const counts = { SI: 0, CL: 0, NO: 0, SIN: 0 };
    movimientos.forEach((m) => {
      const v = m.v1.toUpperCase().trim();
      if (v === "SI") counts.SI++;
      else if (v === "CL") counts.CL++;
      else if (v === "NO") counts.NO++;
      else counts.SIN++;
    });
    return [
      { name: "Verificado", value: counts.SI, color: "#d4edda" },
      { name: "Cliente", value: counts.CL, color: "#cce5ff" },
      { name: "No verificado", value: counts.NO, color: "#f8d7da" },
      { name: "Sin verificar", value: counts.SIN, color: "#e2e8f0" },
    ].filter((d) => d.value > 0);
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
      key: "v1",
      header: "Verif.",
      accessor: (r) => r.v1,
      render: (r) => <VerificationBadge status={r.v1} />,
    },
  ];

  return (
    <div className="space-y-6">
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
          value={filterV1}
          onChange={(e) => setFilterV1(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="all">Todas las verificaciones</option>
          <option value="SI">Verificado (SI)</option>
          <option value="CL">Cliente (CL)</option>
          <option value="NO">No verificado (NO)</option>
          <option value="">Sin verificar</option>
        </select>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Volumen Diario
          </h3>
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
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Estado de Verificacion
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verifStats}
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
                  {verifStats.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
