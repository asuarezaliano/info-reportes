"use client";

import { getFlag } from "@/lib/country-flags";
import type {
  ReportePais,
  ReporteImportador,
  ReporteDepartamento,
  ResumenGeneral,
} from "@/services/declaraciones.service";
import type { TabReporte } from "@/hooks/use-reportes";
import styles from "./reporte-lista.module.css";

type PaginatedData<T> = {
  items: T[];
  total: number;
  totalPages: number;
};

type ReporteListaProps = {
  tabReporte: TabReporte;
  setTabReporte: (tab: TabReporte) => void;
  resumen: ResumenGeneral | undefined;
  paisPag: PaginatedData<ReportePais>;
  importadorPag: PaginatedData<ReporteImportador>;
  deptoPag: PaginatedData<ReporteDepartamento>;
  currentReportPag: PaginatedData<ReportePais | ReporteImportador | ReporteDepartamento>;
  paginaReporte: number;
  setPaginaReporte: React.Dispatch<React.SetStateAction<number>>;
  handleRptSort: (col: string) => void;
  rptSortIndicator: (col: string) => string;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReporteLista({
  tabReporte,
  setTabReporte,
  resumen,
  paisPag,
  importadorPag,
  deptoPag,
  currentReportPag,
  paginaReporte,
  setPaginaReporte,
  handleRptSort,
  rptSortIndicator,
}: ReporteListaProps) {
  return (
    <section className={styles.reportes}>
      <div className={styles.reportHeader}>
        <h3>Datos Detallados</h3>
        <div className={styles.reportTabGroup}>
          <button
            onClick={() => setTabReporte("pais")}
            className={`${styles.reportTab} ${tabReporte === "pais" ? styles.btnActive : ""}`}
          >
            Por País
          </button>
          <button
            onClick={() => setTabReporte("importador")}
            className={`${styles.reportTab} ${tabReporte === "importador" ? styles.btnActive : ""}`}
          >
            Por Importador
          </button>
          <button
            onClick={() => setTabReporte("depto")}
            className={`${styles.reportTab} ${tabReporte === "depto" ? styles.btnActive : ""}`}
          >
            Por Departamento
          </button>
        </div>
      </div>

      <p className={styles.reportCount}>{currentReportPag.total} resultados</p>

      <div className={styles.tablaReporte}>
        {tabReporte === "pais" && (
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleRptSort("pais")}>
                  País{rptSortIndicator("pais")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>
                  Operaciones{rptSortIndicator("cantidadRegistros")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>
                  Total CIF (USD){rptSortIndicator("totalCif")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("totalFob")}>
                  Total FOB (USD){rptSortIndicator("totalFob")}
                </th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {paisPag.items.map((r) => {
                const pct = ((r.totalCif / (resumen?.totalCif ?? 1)) * 100).toFixed(2);
                return (
                  <tr key={r.pais}>
                    <td>
                      {getFlag(r.pais ?? "")} {r.pais}
                    </td>
                    <td>{r.cantidadRegistros.toLocaleString()}</td>
                    <td>${fmt(r.totalCif)}</td>
                    <td>${fmt(r.totalFob)}</td>
                    <td>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                        />
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tabReporte === "importador" && (
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleRptSort("importador")}>
                  Importador{rptSortIndicator("importador")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("nit")}>
                  NIT{rptSortIndicator("nit")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>
                  Operaciones{rptSortIndicator("cantidadRegistros")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>
                  Total CIF (USD){rptSortIndicator("totalCif")}
                </th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {importadorPag.items.map((r, i) => {
                const pct = ((r.totalCif / (resumen?.totalCif ?? 1)) * 100).toFixed(2);
                return (
                  <tr key={i}>
                    <td>{r.importador}</td>
                    <td>{r.nit ?? "-"}</td>
                    <td>{r.cantidadRegistros.toLocaleString()}</td>
                    <td>${fmt(r.totalCif)}</td>
                    <td>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                        />
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tabReporte === "depto" && (
          <table>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => handleRptSort("departamento")}>
                  Departamento{rptSortIndicator("departamento")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>
                  Operaciones{rptSortIndicator("cantidadRegistros")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>
                  Total CIF (USD){rptSortIndicator("totalCif")}
                </th>
                <th className={styles.sortable} onClick={() => handleRptSort("totalFob")}>
                  Total FOB (USD){rptSortIndicator("totalFob")}
                </th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {deptoPag.items.map((r) => {
                const pct = ((r.totalCif / (resumen?.totalCif ?? 1)) * 100).toFixed(2);
                return (
                  <tr key={r.departamento}>
                    <td>{r.departamento}</td>
                    <td>{r.cantidadRegistros.toLocaleString()}</td>
                    <td>${fmt(r.totalCif)}</td>
                    <td>${fmt(r.totalFob)}</td>
                    <td>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                        />
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {currentReportPag.totalPages > 1 && (
        <div className={styles.paginacion}>
          <button
            onClick={() => setPaginaReporte((p) => Math.max(0, p - 1))}
            disabled={paginaReporte === 0}
          >
            Anterior
          </button>
          <span>
            Página {paginaReporte + 1} de {currentReportPag.totalPages}
          </span>
          <button
            onClick={() => setPaginaReporte((p) => Math.min(currentReportPag.totalPages - 1, p + 1))}
            disabled={paginaReporte >= currentReportPag.totalPages - 1}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
