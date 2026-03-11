"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/shared/data-table";
import { VerificationBadge } from "@/components/shared/status-badge";
import { Salida, Compensacion } from "@/types/sheets";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SalidasClientProps {
  salidas: Salida[];
  compensaciones: Compensacion[];
}

export function SalidasClient({ salidas, compensaciones }: SalidasClientProps) {
  const [tab, setTab] = useState<"salidas" | "compensaciones">("salidas");

  const salidasColumns: Column<Salida>[] = [
    {
      key: "fecha",
      header: "Fecha",
      accessor: (r) => r.fecha?.getTime() ?? 0,
      render: (r) => formatDate(r.fecha),
    },
    { key: "pagador", header: "Pagador", accessor: (r) => r.pagador },
    { key: "beneficiario", header: "Beneficiario", accessor: (r) => r.beneficiario },
    {
      key: "importe",
      header: "Importe",
      accessor: (r) => r.importe,
      render: (r) => formatCurrency(r.importe),
      align: "right",
    },
    {
      key: "pTotal",
      header: "Total Pagador",
      accessor: (r) => r.pTotal,
      render: (r) => formatCurrency(r.pTotal),
      align: "right",
    },
    {
      key: "bTotal",
      header: "Total Benef.",
      accessor: (r) => r.bTotal,
      render: (r) => formatCurrency(r.bTotal),
      align: "right",
    },
    {
      key: "verificado",
      header: "Verif.",
      accessor: (r) => r.verificado,
      render: (r) => <VerificationBadge status={r.verificado} />,
    },
    {
      key: "comentario",
      header: "Comentario",
      accessor: (r) => r.comentario,
      sortable: false,
    },
  ];

  const compensacionesColumns: Column<Compensacion>[] = [
    {
      key: "fecha",
      header: "Fecha",
      accessor: (r) => r.fecha?.getTime() ?? 0,
      render: (r) => formatDate(r.fecha),
    },
    { key: "pagador", header: "Pagador", accessor: (r) => r.pagador },
    { key: "beneficiario", header: "Beneficiario", accessor: (r) => r.beneficiario },
    {
      key: "importe",
      header: "Importe",
      accessor: (r) => r.importe,
      render: (r) => formatCurrency(r.importe),
      align: "right",
    },
    {
      key: "pTotal",
      header: "Total Pagador",
      accessor: (r) => r.pTotal,
      render: (r) => formatCurrency(r.pTotal),
      align: "right",
    },
    {
      key: "bTotal",
      header: "Total Benef.",
      accessor: (r) => r.bTotal,
      render: (r) => formatCurrency(r.bTotal),
      align: "right",
    },
    {
      key: "verificado",
      header: "Verif.",
      accessor: (r) => r.verificado,
      render: (r) => <VerificationBadge status={r.verificado} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("salidas")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "salidas"
              ? "bg-card shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Salidas ({salidas.length})
        </button>
        <button
          onClick={() => setTab("compensaciones")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "compensaciones"
              ? "bg-card shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Compensaciones ({compensaciones.length})
        </button>
      </div>

      {tab === "salidas" ? (
        <DataTable
          data={salidas}
          columns={salidasColumns}
          pageSize={30}
          searchable
          searchPlaceholder="Buscar pagador o beneficiario..."
          searchFn={(row, q) =>
            row.pagador.toLowerCase().includes(q) ||
            row.beneficiario.toLowerCase().includes(q)
          }
        />
      ) : (
        <DataTable
          data={compensaciones}
          columns={compensacionesColumns}
          pageSize={30}
          searchable
          searchPlaceholder="Buscar pagador o beneficiario..."
          searchFn={(row, q) =>
            row.pagador.toLowerCase().includes(q) ||
            row.beneficiario.toLowerCase().includes(q)
          }
        />
      )}
    </div>
  );
}
