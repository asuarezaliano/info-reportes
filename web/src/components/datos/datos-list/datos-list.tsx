"use client";

import { getFlag } from "@/lib/country-flags";
import { Lista, type ListaColumn } from "@/components/shared/lista";
import type { ListadoResultado } from "@/services/declaraciones.service";
import styles from "./datos-list.module.css";

type DatosListProps = {
  listado: ListadoResultado | undefined;
  isLoading: boolean;
  pagina: number;
  totalPaginas: number;
  sortCol: string | null;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
  onPageChange: (page: number) => void;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "-";
  const dia = d.getUTCDate().toString().padStart(2, "0");
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const anio = d.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
};

type DeclaracionRow = NonNullable<ListadoResultado["data"]>[number];

export default function DatosList({
  listado,
  isLoading,
  pagina,
  totalPaginas,
  sortCol,
  sortDir,
  onSort,
  onPageChange,
}: DatosListProps) {
  const sortIndicator = (col: string) =>
    sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const columns: ListaColumn<DeclaracionRow>[] = [
    {
      id: "nro_consec",
      header: `Nro${sortIndicator("nro_consec")}`,
      sortable: true,
      onHeaderClick: () => onSort("nro_consec"),
      headerClassName: styles.stickyFirstCol,
      cellClassName: styles.stickyFirstCol,
      cell: (d) => d.nro_consec,
    },
    {
      id: "pais_orige",
      header: `País${sortIndicator("pais_orige")}`,
      sortable: true,
      onHeaderClick: () => onSort("pais_orige"),
      cell: (d) => (d.pais_orige ? `${getFlag(d.pais_orige)} ${d.pais_orige}` : "-"),
    },
    {
      id: "importador",
      header: `Importador${sortIndicator("importador")}`,
      sortable: true,
      onHeaderClick: () => onSort("importador"),
      cell: (d) => d.importador,
    },
    {
      id: "proveedor",
      header: `Proveedor${sortIndicator("proveedor")}`,
      sortable: true,
      onHeaderClick: () => onSort("proveedor"),
      cell: (d) => d.proveedor ?? "-",
    },
    {
      id: "despachant",
      header: `Despachante${sortIndicator("despachant")}`,
      sortable: true,
      onHeaderClick: () => onSort("despachant"),
      cell: (d) => d.despachant ?? "-",
    },
    {
      id: "descripcio",
      header: `Descripción${sortIndicator("descripcio")}`,
      sortable: true,
      onHeaderClick: () => onSort("descripcio"),
      cellClassName: styles.descCell,
      cell: (d) => (
        <span className={styles.descText}>
          {d.descripcio
            ? `${String(d.descripcio).slice(0, 40)}${String(d.descripcio).length > 40 ? "..." : ""}`
            : "-"}
          {d.descripcio && <span className={styles.tooltip}>{String(d.descripcio)}</span>}
        </span>
      ),
    },
    {
      id: "acuerdo_co",
      header: `Acuerdo${sortIndicator("acuerdo_co")}`,
      sortable: true,
      onHeaderClick: () => onSort("acuerdo_co"),
      cell: (d) => d.acuerdo_co ?? "-",
    },
    {
      id: "cantidad",
      header: `Cantidad${sortIndicator("cantidad")}`,
      sortable: true,
      onHeaderClick: () => onSort("cantidad"),
      cell: (d) => d.cantidad,
      align: "right",
    },
    {
      id: "fob",
      header: `FOB (USD)${sortIndicator("fob")}`,
      sortable: true,
      onHeaderClick: () => onSort("fob"),
      cellClassName: styles.moneyCell,
      cell: (d) => (d.fob != null ? `$${fmt(Number(d.fob))}` : "-"),
      align: "right",
    },
    {
      id: "cif_item",
      header: `CIF Item (USD)${sortIndicator("cif_item")}`,
      sortable: true,
      onHeaderClick: () => onSort("cif_item"),
      cellClassName: styles.moneyCell,
      cell: (d) => (d.cif_item != null ? `$${fmt(Number(d.cif_item))}` : "-"),
      align: "right",
    },
    {
      id: "depto_des",
      header: `Depto${sortIndicator("depto_des")}`,
      sortable: true,
      onHeaderClick: () => onSort("depto_des"),
      cell: (d) => d.depto_des,
    },
    {
      id: "fecha_reci",
      header: `Fecha Recepción${sortIndicator("fecha_reci")}`,
      sortable: true,
      onHeaderClick: () => onSort("fecha_reci"),
      cell: (d) => formatFecha(d.fecha_reci as string),
    },
  ];

  if (isLoading) {
    return (
      <section className={styles.datos}>
        <h2>Datos</h2>
        <p className={styles.loading}>Cargando...</p>
      </section>
    );
  }

  return (
    <section className={styles.datos}>
      <h2>Datos ({listado?.total ?? 0} registros)</h2>

      <Lista
        columns={columns}
        data={listado?.data ?? []}
        rowKey={(d) => d.id}
        emptyText="No hay datos para los filtros aplicados"
        maxHeight={700}
        wrapperClassName={styles.enterpriseWrapper}
        tableClassName={styles.enterpriseTable}
      />

      {listado && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Registros filtrados:</span>
            <span className={styles.summaryValue}>{listado.total.toLocaleString()}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total FOB (USD):</span>
            <span className={styles.summaryValue}>${fmt(listado.totalFob)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total CIF (USD):</span>
            <span className={styles.summaryValue}>${fmt(listado.totalCif)}</span>
          </div>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className={styles.paginacion}>
          <button
            onClick={() => onPageChange(Math.max(0, pagina - 1))}
            disabled={pagina === 0}
          >
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPaginas - 1, pagina + 1))}
            disabled={pagina >= totalPaginas - 1}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
