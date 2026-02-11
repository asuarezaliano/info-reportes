"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buscarDeclaraciones,
  getFilterOptions,
  getSubPartidas,
  reportePorPais,
  reportePorImportador,
  reportePorDepartamento,
  resumenGeneral,
  evolucionMensual,
  topCategorias,
  type FiltrosBusqueda,
} from "@/services/declaraciones.service";
import MultiSelectCountry from "@/components/multi-select-country";
import { getFlag } from "@/lib/country-flags";
import { getChapterList, HS_CHAPTERS } from "@/lib/hs-chapters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import styles from "./page.module.css";

const fmtTooltip = (v: number | undefined) => [`$${v != null ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0"}`, ""];

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
  const [rptSortCol, setRptSortCol] = useState<string | null>(null);
  const [rptSortDir, setRptSortDir] = useState<"asc" | "desc">("asc");

  // Filter form state
  const [paisOrige, setPaisOrige] = useState<string[]>([]);
  const [deptoDes, setDeptoDes] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [importador, setImportador] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capitulo, setCapitulo] = useState("");
  const [subPartida, setSubPartida] = useState("");

  // Load filter options (distinct countries & departments)
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  const { data: subPartidas } = useQuery({
    queryKey: ["sub-partidas", capitulo],
    queryFn: () => getSubPartidas(capitulo),
    enabled: capitulo.length === 2,
    staleTime: 5 * 60 * 1000,
  });

  const chapterList = useMemo(() => getChapterList(), []);

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
  });

  const { data: reporteImportador } = useQuery({
    queryKey: ["reporte-importador", mesFiltro],
    queryFn: () => reportePorImportador(mesFiltro || undefined),
  });

  const { data: reporteDepto } = useQuery({
    queryKey: ["reporte-depto", mesFiltro],
    queryFn: () => reportePorDepartamento(mesFiltro || undefined),
  });

  const currentYear = new Date().getFullYear();

  const { data: topPaisesAnual } = useQuery({
    queryKey: ["top-paises-anual", currentYear],
    queryFn: () => reportePorPais(undefined, currentYear),
  });

  const { data: evolucion } = useQuery({
    queryKey: ["evolucion-mensual"],
    queryFn: evolucionMensual,
  });

  const { data: categorias } = useQuery({
    queryKey: ["top-categorias"],
    queryFn: () => topCategorias(8),
  });

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltros({
      pais_orige: paisOrige.length > 0 ? paisOrige.join(",") : undefined,
      importador: importador || undefined,
      descripcion: descripcion || undefined,
      depto_des: deptoDes || undefined,
      partida_ar: subPartida || capitulo || undefined,
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
    setCapitulo("");
    setSubPartida("");
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

  // Report sort
  const handleRptSort = (col: string) => {
    if (rptSortCol === col) {
      setRptSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setRptSortCol(col);
      setRptSortDir("asc");
    }
    setPaginaReporte(0);
  };

  const rptSortIndicator = (col: string) =>
    rptSortCol === col ? (rptSortDir === "asc" ? " ▲" : " ▼") : "";

  // Sort + paginate report data client-side
  const sortAndPaginate = <T extends Record<string, unknown>>(data: T[] | undefined) => {
    if (!data) return { items: [] as T[], total: 0, totalPages: 0 };
    let sorted = data;
    if (rptSortCol) {
      sorted = [...data].sort((a, b) => {
        const valA = a[rptSortCol];
        const valB = b[rptSortCol];
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (typeof valA === "number" && typeof valB === "number") {
          return rptSortDir === "asc" ? valA - valB : valB - valA;
        }
        const cmp = String(valA).localeCompare(String(valB));
        return rptSortDir === "asc" ? cmp : -cmp;
      });
    }
    const start = paginaReporte * REPORTE_PAGE_SIZE;
    return {
      items: sorted.slice(start, start + REPORTE_PAGE_SIZE),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / REPORTE_PAGE_SIZE),
    };
  };

  const paisPag = useMemo(
    () => sortAndPaginate(reportePais),
    [reportePais, paginaReporte, rptSortCol, rptSortDir],
  );
  const importadorPag = useMemo(
    () => sortAndPaginate(reporteImportador),
    [reporteImportador, paginaReporte, rptSortCol, rptSortDir],
  );
  const deptoPag = useMemo(
    () => sortAndPaginate(reporteDepto),
    [reporteDepto, paginaReporte, rptSortCol, rptSortDir],
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
                  <label className={styles.filterLabel}>Categoría producto</label>
                  <select
                    value={capitulo}
                    onChange={(e) => {
                      setCapitulo(e.target.value);
                      setSubPartida("");
                    }}
                    className={styles.select}
                  >
                    <option value="">Todas las categorías</option>
                    {chapterList.map((ch) => (
                      <option key={ch.code} value={ch.code}>{ch.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Sub-partida</label>
                  <select
                    value={subPartida}
                    onChange={(e) => setSubPartida(e.target.value)}
                    className={styles.select}
                    disabled={!capitulo}
                  >
                    <option value="">
                      {capitulo ? "Todas las sub-partidas" : "Elegí una categoría primero"}
                    </option>
                    {subPartidas?.map((sp) => (
                      <option key={sp.codigo} value={sp.codigo} title={sp.descripcion}>
                        {sp.descripcion.length > 50 ? sp.descripcion.slice(0, 50) + "..." : sp.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

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
                        <th
                          className={styles.sortable}
                          onClick={() => handleSort("fecha_reci")}
                        >
                          Fecha Recepción{sortIndicator("fecha_reci")}
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
                          <td className={styles.descCell}>
                            <span className={styles.descText}>
                              {d.descripcio
                                ? String(d.descripcio).slice(0, 40) + "..."
                                : "-"}
                              {d.descripcio && (
                                <span className={styles.tooltip}>{String(d.descripcio)}</span>
                              )}
                            </span>
                          </td>
                          <td>{d.acuerdo_co ?? "-"}</td>
                          <td>{d.cantidad}</td>
                          <td>{d.fob != null ? fmt(Number(d.fob)) : "-"}</td>
                          <td>
                            {d.cif_item != null ? fmt(Number(d.cif_item)) : "-"}
                          </td>
                          <td>{d.mes}</td>
                          <td>{d.depto_des}</td>
                          <td>{d.fecha_reci ? new Date(d.fecha_reci as string).toLocaleDateString("es-BO") : "-"}</td>
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
          {/* Cards resumen */}
          <section className={styles.resumen}>
            {resumen && (
              <div className={styles.cards}>
                <div className={styles.card}>
                  <span>Total registros</span>
                  <strong>{resumen.totalRegistros.toLocaleString()}</strong>
                </div>
                <div className={styles.card}>
                  <span>Total CIF (USD)</span>
                  <strong>${fmt(resumen.totalCif)}</strong>
                </div>
                <div className={styles.card}>
                  <span>Total FOB (USD)</span>
                  <strong>${fmt(resumen.totalFob)}</strong>
                </div>
              </div>
            )}
          </section>

          {/* Row 1: Top 5 Países + Evolución mensual */}
          <div className={styles.chartRow}>
            <section className={styles.chartCard}>
              <h3>Top 5 Países por CIF ({currentYear})</h3>
              {topPaisesAnual && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topPaisesAnual.slice(0, 5).map((r) => ({
                      name: `${getFlag(r.pais ?? "")} ${r.pais}`,
                      CIF: r.totalCif,
                      FOB: r.totalFob,
                    }))}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} style={{ fontSize: "0.75rem" }} />
                    <YAxis type="category" dataKey="name" width={140} style={{ fontSize: "0.75rem" }} />
                    <Tooltip formatter={fmtTooltip} />
                    <Bar dataKey="CIF" fill="#1E40AF" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="FOB" fill="#93C5FD" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className={styles.chartCard}>
              <h3>Evolución Mensual CIF vs FOB</h3>
              {evolucion && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolucion} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" style={{ fontSize: "0.75rem" }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} style={{ fontSize: "0.75rem" }} />
                    <Tooltip formatter={fmtTooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="totalCif" name="CIF" stroke="#1E40AF" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="totalFob" name="FOB" stroke="#D97706" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </section>
          </div>

          {/* Row 2: Top 10 Importadores + Categorías donut */}
          <div className={styles.chartRow}>
            <section className={styles.chartCard}>
              <h3>Top 10 Importadores por CIF</h3>
              {reporteImportador && (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={reporteImportador.slice(0, 10).map((r) => ({
                      name: r.importador && r.importador.length > 25
                        ? r.importador.slice(0, 25) + "..."
                        : r.importador,
                      CIF: r.totalCif,
                    }))}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} style={{ fontSize: "0.75rem" }} />
                    <YAxis type="category" dataKey="name" width={180} style={{ fontSize: "0.72rem" }} />
                    <Tooltip formatter={fmtTooltip} />
                    <Bar dataKey="CIF" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className={styles.chartCard}>
              <h3>Distribución por Categoría</h3>
              {categorias && (() => {
                const COLORS = ["#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#D97706", "#F59E0B", "#FBBF24", "#A3A3A3"];
                const data = categorias.map((c) => ({
                  name: HS_CHAPTERS[c.capitulo] ?? `Cap. ${c.capitulo}`,
                  value: c.totalCif,
                  capitulo: c.capitulo,
                }));
                return (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => {
                          const n = name ?? "";
                          const p = percent ?? 0;
                          return `${n.length > 20 ? n.slice(0, 20) + "..." : n} ${(p * 100).toFixed(1)}%`;
                        }}
                        labelLine={false}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {data.map((_entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, "CIF"]} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </section>
          </div>

          {/* Tablas detalladas */}
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
                onClick={() => { setMesFiltro(mesInput); setAnioFiltro(anioInput); }}
                className={styles.btnPrimary}
              >
                Aplicar
              </button>
              <div className={styles.reportTabGroup}>
                <button
                  onClick={() => { setTabReporte("pais"); setPaginaReporte(0); setRptSortCol(null); }}
                  className={`${styles.reportTab} ${tabReporte === "pais" ? styles.btnActive : ""}`}
                >
                  Por país
                </button>
                <button
                  onClick={() => { setTabReporte("importador"); setPaginaReporte(0); setRptSortCol(null); }}
                  className={`${styles.reportTab} ${tabReporte === "importador" ? styles.btnActive : ""}`}
                >
                  Por importador
                </button>
                <button
                  onClick={() => { setTabReporte("depto"); setPaginaReporte(0); setRptSortCol(null); }}
                  className={`${styles.reportTab} ${tabReporte === "depto" ? styles.btnActive : ""}`}
                >
                  Por departamento
                </button>
              </div>
            </div>

            <p className={styles.reportCount}>{currentReportPag.total} resultados</p>

            <div className={styles.tablaReporte}>
              {tabReporte === "pais" && reportePais && (
                <table>
                  <thead>
                    <tr>
                      <th className={styles.sortable} onClick={() => handleRptSort("pais")}>País{rptSortIndicator("pais")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>Registros{rptSortIndicator("cantidadRegistros")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>Total CIF (USD){rptSortIndicator("totalCif")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("totalFob")}>Total FOB (USD){rptSortIndicator("totalFob")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paisPag.items.map((r) => (
                      <tr key={r.pais}>
                        <td>{getFlag(r.pais ?? "")} {r.pais}</td>
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
                      <th className={styles.sortable} onClick={() => handleRptSort("importador")}>Importador{rptSortIndicator("importador")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("nit")}>NIT{rptSortIndicator("nit")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>Registros{rptSortIndicator("cantidadRegistros")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>Total CIF (USD){rptSortIndicator("totalCif")}</th>
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
                      <th className={styles.sortable} onClick={() => handleRptSort("departamento")}>Departamento{rptSortIndicator("departamento")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>Registros{rptSortIndicator("cantidadRegistros")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>Total CIF (USD){rptSortIndicator("totalCif")}</th>
                      <th className={styles.sortable} onClick={() => handleRptSort("totalFob")}>Total FOB (USD){rptSortIndicator("totalFob")}</th>
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
                <span>Página {paginaReporte + 1} de {currentReportPag.totalPages}</span>
                <button
                  onClick={() => setPaginaReporte((p) => Math.min(currentReportPag.totalPages - 1, p + 1))}
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
