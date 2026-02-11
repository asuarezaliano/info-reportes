"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buscarDeclaraciones,
  getFilterOptions,
  reportePorPais,
  reportePorImportador,
  reportePorDepartamento,
  resumenGeneral,
  type FiltrosBusqueda,
} from "@/services/declaraciones.service";
import MultiSelectCountry from "@/components/multi-select-country";
import { getFlag } from "@/lib/country-flags";
import styles from "./page.module.css";

const REPORTE_PAGE_SIZE = 100;

export default function DatosPage() {
  // Main tab
  const [tabPrincipal, setTabPrincipal] = useState<"busqueda" | "reportes">(
    "busqueda",
  );

  const [filtros, setFiltros] = useState<FiltrosBusqueda>({ limit: 100 });
  const [pagina, setPagina] = useState(0);
  const [tabReporte, setTabReporte] = useState<"pais" | "importador" | "depto">(
    "pais",
  );
  const [mesInput, setMesInput] = useState("");
  const [anioInput, setAnioInput] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [anioFiltro, setAnioFiltro] = useState("");
  const [paginaReporte, setPaginaReporte] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Filter form state
  const [paisOrige, setPaisOrige] = useState<string[]>([]);
  const [deptoDes, setDeptoDes] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [importador, setImportador] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Load filter options (distinct countries & departments)
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const { data: listado, isLoading } = useQuery({
    queryKey: ["declaraciones", filtros, pagina, sortCol, sortDir],
    queryFn: () =>
      buscarDeclaraciones({
        ...filtros,
        sortBy: sortCol ?? undefined,
        sortDir: sortCol ? sortDir : undefined,
        offset: pagina * (filtros.limit || 100),
      }),
  });

  const { data: resumen } = useQuery({
    queryKey: ["resumen", mesFiltro, anioFiltro],
    queryFn: () =>
      resumenGeneral(
        mesFiltro || undefined,
        anioFiltro ? parseInt(anioFiltro) : undefined,
      ),
  });

  const { data: reportePais } = useQuery({
    queryKey: ["reporte-pais", mesFiltro, anioFiltro],
    queryFn: () =>
      reportePorPais(
        mesFiltro || undefined,
        anioFiltro ? parseInt(anioFiltro) : undefined,
      ),
    enabled: tabReporte === "pais",
  });

  const { data: reporteImportador } = useQuery({
    queryKey: ["reporte-importador", mesFiltro],
    queryFn: () => reportePorImportador(mesFiltro || undefined),
    enabled: tabReporte === "importador",
  });

  const { data: reporteDepto } = useQuery({
    queryKey: ["reporte-depto", mesFiltro],
    queryFn: () => reportePorDepartamento(mesFiltro || undefined),
    enabled: tabReporte === "depto",
  });

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltros({
      pais_orige: paisOrige.length > 0 ? paisOrige.join(",") : undefined,
      importador: importador || undefined,
      descripcion: descripcion || undefined,
      depto_des: deptoDes || undefined,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      limit: 100,
    });
    setPagina(0);
  };

  const handleLimpiar = () => {
    setPaisOrige([]);
    setDeptoDes("");
    setFechaDesde("");
    setFechaHasta("");
    setImportador("");
    setDescripcion("");
    setFiltros({ limit: 100 });
    setPagina(0);
  };

  const totalPaginas = listado
    ? Math.ceil(listado.total / (filtros.limit || 25))
    : 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortIndicator = (col: string) =>
    sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";


  // Paginate report data client-side
  const paginate = <T,>(data: T[] | undefined) => {
    if (!data) return { items: [] as T[], total: 0, totalPages: 0 };
    const start = paginaReporte * REPORTE_PAGE_SIZE;
    return {
      items: data.slice(start, start + REPORTE_PAGE_SIZE),
      total: data.length,
      totalPages: Math.ceil(data.length / REPORTE_PAGE_SIZE),
    };
  };

  const paisPag = useMemo(
    () => paginate(reportePais),
    [reportePais, paginaReporte],
  );
  const importadorPag = useMemo(
    () => paginate(reporteImportador),
    [reporteImportador, paginaReporte],
  );
  const deptoPag = useMemo(
    () => paginate(reporteDepto),
    [reporteDepto, paginaReporte],
  );

  const currentReportPag =
    tabReporte === "pais"
      ? paisPag
      : tabReporte === "importador"
        ? importadorPag
        : deptoPag;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Datos Aduaneros</h1>
      </header>

      {/* ── Tabs principales ── */}
      <nav className={styles.mainTabs}>
        <button
          className={`${styles.mainTab} ${tabPrincipal === "busqueda" ? styles.mainTabActive : ""}`}
          onClick={() => setTabPrincipal("busqueda")}
        >
          Búsqueda
        </button>
        <button
          className={`${styles.mainTab} ${tabPrincipal === "reportes" ? styles.mainTabActive : ""}`}
          onClick={() => setTabPrincipal("reportes")}
        >
          Reportes
        </button>
      </nav>

      {/* ══════════════════════════════════════ */}
      {/* ── TAB: Búsqueda                    ── */}
      {/* ══════════════════════════════════════ */}
      {tabPrincipal === "busqueda" && (
        <>
          {/* Filtros */}
          <section className={styles.busqueda}>
            <h2>Filtros de Búsqueda</h2>
            <form onSubmit={handleBuscar} className={styles.filterGrid}>
              <div className={styles.filterRow4}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>País de origen</label>
                  <MultiSelectCountry
                    options={filterOptions?.paises ?? []}
                    selected={paisOrige}
                    onChange={setPaisOrige}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Importador</label>
                  <input
                    value={importador}
                    onChange={(e) => setImportador(e.target.value)}
                    placeholder="Nombre del importador"
                    className={styles.input}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    Descripción producto
                  </label>
                  <input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del producto"
                    className={styles.input}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Departamento</label>
                  <select
                    value={deptoDes}
                    onChange={(e) => setDeptoDes(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Todos los departamentos</option>
                    {filterOptions?.departamentos.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.filterRow4}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Fecha desde</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Fecha hasta</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.filterGroup} />
                <div className={styles.filterActions}>
                  <button type="submit" className={styles.btnPrimary}>
                    Buscar
                  </button>
                  <button
                    type="button"
                    onClick={handleLimpiar}
                    className={styles.btnSecondary}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Tabla de datos */}
          <section className={styles.datos}>
            <h2>Datos ({listado?.total ?? 0} registros)</h2>
            {isLoading ? (
              <p>Cargando...</p>
            ) : (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.tablaDatos}>
                    <thead>
                      <tr>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("nro_consec")}
                        >
                          Nro{sortIndicator("nro_consec")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("pais_orige")}
                        >
                          País{sortIndicator("pais_orige")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("importador")}
                        >
                          Importador{sortIndicator("importador")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("despachant")}
                        >
                          Despachante{sortIndicator("despachant")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("descripcio")}
                        >
                          Descripción{sortIndicator("descripcio")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("acuerdo_co")}
                        >
                          Acuerdo{sortIndicator("acuerdo_co")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("cantidad")}
                        >
                          Cantidad{sortIndicator("cantidad")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("fob")}
                        >
                          FOB (USD){sortIndicator("fob")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("cif_item")}
                        >
                          CIF Item (USD){sortIndicator("cif_item")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("mes")}
                        >
                          Mes{sortIndicator("mes")}
                        </th>
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("depto_des")}
                        >
                          Depto{sortIndicator("depto_des")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {listado?.data.map((d) => (
                        <tr key={d.id}>
                          <td>{d.nro_consec}</td>
                          <td>
                            {d.pais_orige
                              ? `${getFlag(d.pais_orige)} ${d.pais_orige}`
                              : "-"}
                          </td>
                          <td>{d.importador}</td>
                          <td>{d.despachant ?? "-"}</td>
                          <td className={styles.desc}>
                            {d.descripcio
                              ? String(d.descripcio).slice(0, 40) + "..."
                              : "-"}
                          </td>
                          <td>{d.acuerdo_co ?? "-"}</td>
                          <td>{d.cantidad}</td>
                          <td>{d.fob != null ? fmt(Number(d.fob)) : "-"}</td>
                          <td>
                            {d.cif_item != null ? fmt(Number(d.cif_item)) : "-"}
                          </td>
                          <td>{d.mes}</td>
                          <td>{d.depto_des}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {listado && (
                  <div className={styles.summaryBar}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>
                        Registros filtrados:
                      </span>
                      <span className={styles.summaryValue}>
                        {listado.total.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>
                        Total FOB (USD):
                      </span>
                      <span className={styles.summaryValue}>
                        ${fmt(listado.totalFob)}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>
                        Total CIF (USD):
                      </span>
                      <span className={styles.summaryValue}>
                        ${fmt(listado.totalCif)}
                      </span>
                    </div>
                  </div>
                )}

                {totalPaginas > 1 && (
                  <div className={styles.paginacion}>
                    <button
                      onClick={() => setPagina((p) => Math.max(0, p - 1))}
                      disabled={pagina === 0}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {pagina + 1} de {totalPaginas}
                    </span>
                    <button
                      onClick={() =>
                        setPagina((p) => Math.min(totalPaginas - 1, p + 1))
                      }
                      disabled={pagina >= totalPaginas - 1}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ── TAB: Reportes                    ── */}
      {/* ══════════════════════════════════════ */}
      {tabPrincipal === "reportes" && (
        <>
          {/* Resumen general */}
          <section className={styles.resumen}>
            {resumen && (
              <div className={styles.cards}>
                <div className={styles.card}>
                  <span>Total registros</span>
                  <strong>{resumen.totalRegistros.toLocaleString()}</strong>
                </div>
                <div className={styles.card}>
                  <span>Total CIF (USD)</span>
                  <strong>{fmt(resumen.totalCif)}</strong>
                </div>
                <div className={styles.card}>
                  <span>Total FOB (USD)</span>
                  <strong>{fmt(resumen.totalFob)}</strong>
                </div>
              </div>
            )}
          </section>

          {/* Reportes */}
          <section className={styles.reportes}>
            <div className={styles.reportFilters}>
              <input
                placeholder="Mes (OCT25)"
                value={mesInput}
                onChange={(e) => setMesInput(e.target.value)}
                className={styles.input}
              />
              <input
                placeholder="Año"
                value={anioInput}
                onChange={(e) => setAnioInput(e.target.value)}
                className={styles.input}
              />
              <button
                onClick={() => {
                  setMesFiltro(mesInput);
                  setAnioFiltro(anioInput);
                }}
                className={styles.btnPrimary}
              >
                Aplicar
              </button>
              <div className={styles.reportTabGroup}>
                <button
                  onClick={() => {
                    setTabReporte("pais");
                    setPaginaReporte(0);
                  }}
                  className={`${styles.reportTab} ${tabReporte === "pais" ? styles.btnActive : ""}`}
                >
                  Por país
                </button>
                <button
                  onClick={() => {
                    setTabReporte("importador");
                    setPaginaReporte(0);
                  }}
                  className={`${styles.reportTab} ${tabReporte === "importador" ? styles.btnActive : ""}`}
                >
                  Por importador
                </button>
                <button
                  onClick={() => {
                    setTabReporte("depto");
                    setPaginaReporte(0);
                  }}
                  className={`${styles.reportTab} ${tabReporte === "depto" ? styles.btnActive : ""}`}
                >
                  Por departamento
                </button>
              </div>
            </div>

            <p className={styles.reportCount}>
              {currentReportPag.total} resultados
            </p>

            <div className={styles.tablaReporte}>
              {tabReporte === "pais" && reportePais && (
                <table>
                  <thead>
                    <tr>
                      <th>País</th>
                      <th>Registros</th>
                      <th>Total CIF (USD)</th>
                      <th>Total FOB (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paisPag.items.map((r) => (
                      <tr key={r.pais}>
                        <td>{r.pais}</td>
                        <td>{r.cantidadRegistros}</td>
                        <td>{fmt(r.totalCif)}</td>
                        <td>{fmt(r.totalFob)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tabReporte === "importador" && reporteImportador && (
                <table>
                  <thead>
                    <tr>
                      <th>Importador</th>
                      <th>NIT</th>
                      <th>Registros</th>
                      <th>Total CIF (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importadorPag.items.map((r, i) => (
                      <tr key={i}>
                        <td>{r.importador}</td>
                        <td>{r.nit}</td>
                        <td>{r.cantidadRegistros}</td>
                        <td>{fmt(r.totalCif)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tabReporte === "depto" && reporteDepto && (
                <table>
                  <thead>
                    <tr>
                      <th>Departamento</th>
                      <th>Registros</th>
                      <th>Total CIF (USD)</th>
                      <th>Total FOB (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptoPag.items.map((r) => (
                      <tr key={r.departamento}>
                        <td>{r.departamento}</td>
                        <td>{r.cantidadRegistros}</td>
                        <td>{fmt(r.totalCif)}</td>
                        <td>{fmt(r.totalFob)}</td>
                      </tr>
                    ))}
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
                  onClick={() =>
                    setPaginaReporte((p) =>
                      Math.min(currentReportPag.totalPages - 1, p + 1),
                    )
                  }
                  disabled={paginaReporte >= currentReportPag.totalPages - 1}
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
