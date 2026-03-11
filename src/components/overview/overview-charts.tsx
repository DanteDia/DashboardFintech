"use client";

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
import { CarteraBanco, Operacion } from "@/types/sheets";
import { STATUS_COLORS } from "@/lib/constants";
import { formatCompactNumber } from "@/lib/utils";

interface BankBalanceChartProps {
  bancos: CarteraBanco[];
}

export function BankBalanceChart({ bancos }: BankBalanceChartProps) {
  const data = bancos
    .filter((b) => b.usdSaldo != null)
    .sort((a, b) => Math.abs(b.usdSaldo ?? 0) - Math.abs(a.usdSaldo ?? 0))
    .slice(0, 8)
    .map((b) => ({
      name: b.cliente.length > 18 ? b.cliente.slice(0, 18) + "..." : b.cliente,
      saldo: b.usdSaldo ?? 0,
    }));

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Top Bancos por Saldo
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
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
            <Tooltip
              formatter={(value) =>
                `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              }
            />
            <Bar
              dataKey="saldo"
              radius={[0, 4, 4, 0]}
              fill="#4285f4"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface OperationsStatusChartProps {
  operaciones: Operacion[];
}

export function OperationsStatusChart({ operaciones }: OperationsStatusChartProps) {
  const counts = operaciones.reduce(
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

  const data: { name: string; value: number; color: string }[] = [
    { name: "Cerrado", value: counts.cerrado, color: STATUS_COLORS.CERRADO.bg },
    { name: "Debe", value: counts.debe, color: STATUS_COLORS.DEBE.bg },
    { name: "Debemos", value: counts.debemos, color: STATUS_COLORS.DEBEMOS.bg },
  ].filter((d) => d.value > 0);

  if (counts.otros > 0) {
    data.push({ name: "Otros", value: counts.otros, color: "#e2e8f0" });
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Estado de Operaciones
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
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
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Legend fontSize={12} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
