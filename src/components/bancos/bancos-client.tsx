"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DataTable, Column } from "@/components/shared/data-table";
import { CarteraBanco, CarteraBancoVerificado } from "@/types/sheets";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import { Landmark } from "lucide-react";
import { useMemo } from "react";

interface BancosClientProps {
  bancos: CarteraBanco[];
  bancosVerificado: CarteraBancoVerificado[];
}

export function BancosClient({ bancos, bancosVerificado }: BancosClientProps) {
  const totalSaldo = bancos.reduce((sum, b) => sum + (b.usdSaldo ?? 0), 0);
  const totalPendiente = bancos.reduce(
    (sum, b) => sum + (b.pendiente ?? 0),
    0
  );

  const balanceData = useMemo(
    () =>
      bancos
        .filter((b) => b.usdSaldo != null)
        .sort((a, b) => (b.usdSaldo ?? 0) - (a.usdSaldo ?? 0))
        .map((b) => ({
          name:
            b.cliente.length > 20
              ? b.cliente.slice(0, 20) + "..."
              : b.cliente,
          saldo: b.usdSaldo ?? 0,
        })),
    [bancos]
  );

  const flowData = useMemo(
    () =>
      bancosVerificado
        .filter((b) => (b.ingreso ?? 0) > 0 || (b.egreso ?? 0) > 0)
        .sort((a, b) => (b.ingreso ?? 0) - (a.ingreso ?? 0))
        .slice(0, 10)
        .map((b) => ({
          name:
            b.cliente.length > 18
              ? b.cliente.slice(0, 18) + "..."
              : b.cliente,
          ingreso: b.ingreso ?? 0,
          egreso: b.egreso ?? 0,
        })),
    [bancosVerificado]
  );

  const bancosColumns: Column<CarteraBanco>[] = [
    { key: "cliente", header: "Banco", accessor: (r) => r.cliente },
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
            (r.usdSaldo ?? 0) >= 0
              ? "text-emerald-600 font-semibold"
              : "text-red-500 font-semibold"
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
      key: "saldoUnificado",
      header: "S. Unificado",
      accessor: (r) => r.saldoUnificado,
      render: (r) => formatCurrency(r.saldoUnificado),
      align: "right",
    },
    {
      key: "saldoReal",
      header: "Saldo Real",
      accessor: (r) => r.saldoReal,
      render: (r) => formatCurrency(r.saldoReal),
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Balance Total"
          value={formatCurrency(totalSaldo)}
          icon={Landmark}
        />
        <KpiCard
          title="Total Pendiente"
          value={formatCurrency(totalPendiente)}
        />
        <KpiCard
          title="Cuentas Bancarias"
          value={String(bancos.length)}
        />
      </div>

      <DataTable
        data={bancos}
        columns={bancosColumns}
        pageSize={25}
        searchable
        searchPlaceholder="Buscar banco..."
        searchFn={(row, q) => row.cliente.toLowerCase().includes(q)}
        rowClassName={(row) => {
          const saldo = row.usdSaldo ?? 0;
          if (saldo > 0) return "bg-[#d5f4e6]/20";
          if (saldo < 0) return "bg-[#ffeaa7]/20";
          return "";
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Saldo por Banco
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <YAxis type="category" dataKey="name" width={140} fontSize={10} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="saldo" fill="#4285f4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Ingresos vs Egresos (Top 10)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => formatCompactNumber(v)} fontSize={12} />
                <YAxis type="category" dataKey="name" width={130} fontSize={10} tick={{ fill: "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="ingreso" name="Ingresos" fill="#34a853" radius={[0, 4, 4, 0]} />
                <Bar dataKey="egreso" name="Egresos" fill="#ea4335" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
