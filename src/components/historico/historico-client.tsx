"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { HistoricoOperacion, HistoricoEntrada, HistoricoSalida } from "@/types/sheets";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";
import { KpiCard } from "@/components/shared/kpi-card";
import { History, TrendingUp, ArrowUpRight } from "lucide-react";

interface HistoricoClientProps {
  operaciones: HistoricoOperacion[];
  entradas: HistoricoEntrada[];
  salidas: HistoricoSalida[];
}

export function HistoricoClient({
  operaciones,
  entradas,
  salidas,
}: HistoricoClientProps) {
  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {};
    operaciones.forEach((op) => {
      if (op.ano && op.mes) {
        const key = `${op.ano}-${String(op.mes).padStart(2, "0")}`;
        if (!map[key]) map[key] = { count: 0, volume: 0 };
        map[key].count++;
        map[key].volume += op.importe ?? 0;
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        operaciones: data.count,
        volumen: data.volume,
      }));
  }, [operaciones]);

  // YoY comparison
  const yoyData = useMemo(() => {
    const byYear: Record<number, Record<number, number>> = {};
    operaciones.forEach((op) => {
      if (op.ano && op.mes) {
        if (!byYear[op.ano]) byYear[op.ano] = {};
        byYear[op.ano][op.mes] = (byYear[op.ano][op.mes] || 0) + (op.importe ?? 0);
      }
    });

    const years = Object.keys(byYear)
      .map(Number)
      .sort();
    return Array.from({ length: 12 }, (_, i) => {
      const monthData: Record<string, string | number> = {
        mes: MONTHS[i].slice(0, 3),
      };
      years.forEach((y) => {
        monthData[String(y)] = byYear[y]?.[i + 1] ?? 0;
      });
      return monthData;
    });
  }, [operaciones]);

  const years = useMemo(() => {
    const set = new Set<number>();
    operaciones.forEach((op) => op.ano && set.add(op.ano));
    return [...set].sort();
  }, [operaciones]);

  const totalOps = operaciones.length;
  const totalEntradas = entradas.length;
  const totalVolume = operaciones.reduce(
    (sum, op) => sum + (op.importe ?? 0),
    0
  );

  const YEAR_COLORS = ["#4285f4", "#ea4335", "#34a853", "#fbbc04"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Operaciones Historicas"
          value={String(totalOps)}
          icon={History}
          subtitle="May 2024 - Oct 2025"
        />
        <KpiCard
          title="Pagos Recibidos"
          value={String(totalEntradas)}
          icon={ArrowUpRight}
        />
        <KpiCard
          title="Volumen Total"
          value={formatCurrency(totalVolume)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Monthly trend */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Tendencia Mensual - Operaciones
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <XAxis dataKey="month" fontSize={10} tick={{ fill: "#64748b" }} />
                <YAxis yAxisId="count" orientation="left" fontSize={12} />
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  tickFormatter={(v) => formatCompactNumber(v)}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === "volumen" ? formatCurrency(Number(value)) : String(value ?? "")
                  }
                />
                <Legend />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="operaciones"
                  stroke="#4285f4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="volume"
                  type="monotone"
                  dataKey="volumen"
                  stroke="#34a853"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* YoY comparison */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Comparativa Año a Año - Volumen
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyData}>
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                {years.map((year, i) => (
                  <Bar
                    key={year}
                    dataKey={String(year)}
                    name={String(year)}
                    fill={YEAR_COLORS[i % YEAR_COLORS.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
