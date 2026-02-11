"use client";

import { getFlag } from "@/lib/country-flags";
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

      <div className={styles.tableWrapper}>
        <table className={styles.tablaDatos}>
          <thead>
            <tr>
              <th className={styles.sortable} onClick={() => onSort("nro_consec")}>
                Nro{sortIndicator("nro_consec")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("pais_orige")}>
                País{sortIndicator("pais_orige")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("importador")}>
                Importador{sortIndicator("importador")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("despachant")}>
                Despachante{sortIndicator("despachant")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("descripcio")}>
                Descripción{sortIndicator("descripcio")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("acuerdo_co")}>
                Acuerdo{sortIndicator("acuerdo_co")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("cantidad")}>
                Cantidad{sortIndicator("cantidad")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("fob")}>
                FOB (USD){sortIndicator("fob")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("cif_item")}>
                CIF Item (USD){sortIndicator("cif_item")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("mes")}>
                Mes{sortIndicator("mes")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("depto_des")}>
                Depto{sortIndicator("depto_des")}
              </th>
              <th className={styles.sortable} onClick={() => onSort("fecha_reci")}>
                Fecha Recepción{sortIndicator("fecha_reci")}
              </th>
            </tr>
          </thead>
          <tbody>
            {listado?.data.map((d) => (
              <tr key={d.id}>
                <td>{d.nro_consec}</td>
                <td>{d.pais_orige ? `${getFlag(d.pais_orige)} ${d.pais_orige}` : "-"}</td>
                <td>{d.importador}</td>
                <td>{d.despachant ?? "-"}</td>
                <td className={styles.descCell}>
                  <span className={styles.descText}>
                    {d.descripcio ? String(d.descripcio).slice(0, 40) + "..." : "-"}
                    {d.descripcio && <span className={styles.tooltip}>{String(d.descripcio)}</span>}
                  </span>
                </td>
                <td>{d.acuerdo_co ?? "-"}</td>
                <td>{d.cantidad}</td>
                <td>{d.fob != null ? fmt(Number(d.fob)) : "-"}</td>
                <td>{d.cif_item != null ? fmt(Number(d.cif_item)) : "-"}</td>
                <td>{d.mes}</td>
                <td>{d.depto_des}</td>
                <td>{formatFecha(d.fecha_reci as string)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
