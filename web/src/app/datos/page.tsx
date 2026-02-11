"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  reportePorPais,
  reportePorImportador,
  reportePorDepartamento,
  resumenGeneral,
  evolucionMensual,
  topCategorias,
} from "@/services/declaraciones.service";
import { useFiltrosBusqueda } from "@/hooks/use-filtros-busqueda";
import HeaderFilter from "@/components/datos/header-filter";
import DatosList from "@/components/datos/datos-list";
import { ReporteGenerated } from "@/components/datos/reporte-generated";
import { getFlag } from "@/lib/country-flags";
import { HS_CHAPTERS } from "@/lib/hs-chapters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import styles from "./page.module.css";

const fmtTooltip = (v: number | undefined) => [`$${v != null ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0"}`, ""];

const formatFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "-";
  const dia = d.getUTCDate().toString().padStart(2, "0");
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const anio = d.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
};

const REPORTE_PAGE_SIZE = 100;

export default function DatosPage() {
  // Main tab
  const [tabPrincipal, setTabPrincipal] = useState<"busqueda" | "reportes">("busqueda");

  // Use the custom hook for filters
  const {
    filtrosForm,
    setFiltrosForm,
    pagina,
    setPagina,
    sortCol,
    sortDir,
    handleSort,
    listado,
    isLoading,
    totalPaginas,
    filterOptions,
    subPartidas,
    chapterList,
    handleBuscar,
    handleLimpiar,
    mostrarReporte,
    setMostrarReporte,
    handleGenerarReporte,
  } = useFiltrosBusqueda();

  // Reportes tab state
  const [tabReporte, setTabReporte] = useState<"pais" | "importador" | "depto">("pais");
  const [mesInput, setMesInput] = useState("");
  const [anioInput, setAnioInput] = useState("");
  const [mesFiltro, setMesFiltro] = useState("");
  const [anioFiltro, setAnioFiltro] = useState("");
  const [paginaReporte, setPaginaReporte] = useState(0);
  const [rptSortCol, setRptSortCol] = useState<string | null>(null);
  const [rptSortDir, setRptSortDir] = useState<"asc" | "desc">("asc");

  // Queries for Reportes tab
  const { data: resumen } = useQuery({
    queryKey: ["resumen", mesFiltro, anioFiltro],
    queryFn: () => resumenGeneral(mesFiltro || undefined, anioFiltro ? parseInt(anioFiltro) : undefined),
  });

  const { data: reportePais } = useQuery({
    queryKey: ["reporte-pais", mesFiltro, anioFiltro],
    queryFn: () => reportePorPais(mesFiltro || undefined, anioFiltro ? parseInt(anioFiltro) : undefined),
  });

  const { data: reporteImportador } = useQuery({
    queryKey: ["reporte-importador", mesFiltro],
    queryFn: () => reportePorImportador(mesFiltro || undefined),
  });

  const { data: reporteDepto } = useQuery({
    queryKey: ["reporte-depto", mesFiltro],
    queryFn: () => reportePorDepartamento(mesFiltro || undefined),
  });

  const { data: evolucion } = useQuery({
    queryKey: ["evolucion-mensual"],
    queryFn: evolucionMensual,
  });

  const { data: categorias } = useQuery({
    queryKey: ["top-categorias"],
    queryFn: () => topCategorias(8),
  });

  // Compute report data from listado (for search tab report)
  const reporteData = useMemo(() => {
    if (!listado?.data) return null;
    const data = listado.data;
    // Calcular totales SOLO de los datos filtrados (no del total general)
    const totalMonto = data.reduce((sum, d) => sum + Number(d.cif_item || 0), 0) || 1;
    const totalPesoNeto = data.reduce((sum, d) => sum + Number(d.p_neto || 0), 0);

    // Tab 1: Importadores - Importador, Monto USD, Peso Neto, % Monto
    const porImportador = data.reduce((acc, d) => {
      const imp = d.importador || "Sin importador";
      if (!acc[imp]) acc[imp] = { importador: imp, monto: 0, pesoNeto: 0, operaciones: 0 };
      acc[imp].monto += Number(d.cif_item || 0);
      acc[imp].pesoNeto += Number(d.p_neto || 0);
      acc[imp].operaciones += 1;
      return acc;
    }, {} as Record<string, { importador: string; monto: number; pesoNeto: number; operaciones: number }>);

    // Tab 2: Proveedores - Proveedor, País, Operaciones, Monto, Peso, % Monto
    const porProveedor = data.reduce((acc, d) => {
      const prov = d.proveedor || "Sin proveedor";
      const key = `${prov}||${d.pais_orige || ""}`;
      if (!acc[key]) acc[key] = { proveedor: prov, pais: d.pais_orige || "-", monto: 0, pesoNeto: 0, operaciones: 0 };
      acc[key].monto += Number(d.cif_item || 0);
      acc[key].pesoNeto += Number(d.p_neto || 0);
      acc[key].operaciones += 1;
      return acc;
    }, {} as Record<string, { proveedor: string; pais: string; monto: number; pesoNeto: number; operaciones: number }>);

    // Tab 3: Países de Procedencia - País, Monto, Peso, % Monto + gráfica por mes
    const porPaisProcedencia = data.reduce((acc, d) => {
      const pais = d.pais_pro || d.pais_orige || "Sin país";
      if (!acc[pais]) acc[pais] = { pais, monto: 0, pesoNeto: 0, operaciones: 0 };
      acc[pais].monto += Number(d.cif_item || 0);
      acc[pais].pesoNeto += Number(d.p_neto || 0);
      acc[pais].operaciones += 1;
      return acc;
    }, {} as Record<string, { pais: string; monto: number; pesoNeto: number; operaciones: number }>);

    // Países por mes para la gráfica de barras
    const paisesPorMes = data.reduce((acc, d) => {
      const mes = d.mes || "Sin mes";
      const pais = d.pais_pro || d.pais_orige || "Otros";
      if (!acc[mes]) acc[mes] = { mes, total: 0, paises: {} as Record<string, number> };
      acc[mes].total += Number(d.cif_item || 0);
      acc[mes].paises[pais] = (acc[mes].paises[pais] || 0) + Number(d.cif_item || 0);
      return acc;
    }, {} as Record<string, { mes: string; total: number; paises: Record<string, number> }>);

    // Get top 5 countries for the chart
    const allPaises = Object.values(porPaisProcedencia).sort((a, b) => b.monto - a.monto);
    const topPaises = allPaises.slice(0, 5).map(p => p.pais);

    // Build chart data with percentages
    const chartPorMes = Object.values(paisesPorMes)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map(m => {
        const row: Record<string, string | number> = { mes: m.mes };
        topPaises.forEach(pais => {
          const val = m.paises[pais] || 0;
          row[pais] = m.total > 0 ? Number(((val / m.total) * 100).toFixed(1)) : 0;
        });
        // Otros
        const otrosVal = Object.entries(m.paises)
          .filter(([p]) => !topPaises.includes(p))
          .reduce((sum, [, v]) => sum + v, 0);
        row["Otros"] = m.total > 0 ? Number(((otrosVal / m.total) * 100).toFixed(1)) : 0;
        return row;
      });

    return {
      totalMonto,
      totalPesoNeto,
      porImportador: Object.values(porImportador).sort((a, b) => b.monto - a.monto),
      porProveedor: Object.values(porProveedor).sort((a, b) => b.monto - a.monto),
      porPaisProcedencia: allPaises,
      chartPorMes,
      topPaises: [...topPaises, "Otros"],
    };
  }, [listado]);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Report tab sorting
  const handleRptSort = (col: string) => {
    if (rptSortCol === col) {
      setRptSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setRptSortCol(col);
      setRptSortDir("asc");
    }
    setPaginaReporte(0);
  };

  const rptSortIndicator = (col: string) => rptSortCol === col ? (rptSortDir === "asc" ? " ▲" : " ▼") : "";

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
        return rptSortDir === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
    const start = paginaReporte * REPORTE_PAGE_SIZE;
    return {
      items: sorted.slice(start, start + REPORTE_PAGE_SIZE),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / REPORTE_PAGE_SIZE),
    };
  };

  const paisPag = useMemo(() => sortAndPaginate(reportePais), [reportePais, paginaReporte, rptSortCol, rptSortDir]);
  const importadorPag = useMemo(() => sortAndPaginate(reporteImportador), [reporteImportador, paginaReporte, rptSortCol, rptSortDir]);
  const deptoPag = useMemo(() => sortAndPaginate(reporteDepto), [reporteDepto, paginaReporte, rptSortCol, rptSortDir]);

  const currentReportPag = tabReporte === "pais" ? paisPag : tabReporte === "importador" ? importadorPag : deptoPag;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Datos Aduaneros</h1>
      </header>

      {/* Tabs principales */}
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
          <HeaderFilter
            filtrosForm={filtrosForm}
            setFiltrosForm={setFiltrosForm}
            filterOptions={filterOptions}
            subPartidas={subPartidas}
            chapterList={chapterList}
            onBuscar={handleBuscar}
            onLimpiar={handleLimpiar}
            onGenerarReporte={handleGenerarReporte}
            canGenerateReport={!!listado?.data?.length}
          />

          <DatosList
            listado={listado}
            isLoading={isLoading}
            pagina={pagina}
            totalPaginas={totalPaginas}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleSort}
            onPageChange={setPagina}
          />

          {/* Reporte Visual en Búsqueda */}
          {mostrarReporte && reporteData && (
            <ReporteGenerated
              reporteData={reporteData}
              filtrosForm={filtrosForm}
              subPartidas={subPartidas}
              totalRegistros={listado?.total ?? 0}
              onClose={() => setMostrarReporte(false)}
            />
          )}
        </>
      )}

      {/* ══════════════════════════════════════ */}
      {/* ── TAB: Reportes                    ── */}
      {/* ══════════════════════════════════════ */}
      {tabPrincipal === "reportes" && (
        <>
          <section className={styles.reportFilterBar}>
            <div className={styles.reportFilterGroup}>
              <label>Filtrar por período:</label>
              <input placeholder="Mes (ej: OCT25)" value={mesInput} onChange={(e) => setMesInput(e.target.value)} className={styles.input} />
              <input placeholder="Año (ej: 2025)" value={anioInput} onChange={(e) => setAnioInput(e.target.value)} className={styles.input} style={{ width: "100px" }} />
              <button onClick={() => { setMesFiltro(mesInput); setAnioFiltro(anioInput); setPaginaReporte(0); }} className={styles.btnPrimary}>Aplicar</button>
              {(mesFiltro || anioFiltro) && (
                <button onClick={() => { setMesFiltro(""); setAnioFiltro(""); setMesInput(""); setAnioInput(""); }} className={styles.btnSecondary}>Limpiar</button>
              )}
            </div>
            {(mesFiltro || anioFiltro) && (
              <span className={styles.filterBadge}>Filtrando: {mesFiltro && `Mes ${mesFiltro}`} {anioFiltro && `Año ${anioFiltro}`}</span>
            )}
          </section>

          <section className={styles.resumen}>
            {resumen && (
              <div className={styles.cardsGrid}>
                <div className={styles.cardLarge}><div className={styles.cardIcon}>📊</div><div className={styles.cardContent}><span>Total Operaciones</span><strong>{resumen.totalRegistros.toLocaleString()}</strong></div></div>
                <div className={styles.cardLarge}><div className={styles.cardIcon}>💵</div><div className={styles.cardContent}><span>Total CIF (USD)</span><strong>${fmt(resumen.totalCif)}</strong></div></div>
                <div className={styles.cardLarge}><div className={styles.cardIcon}>📦</div><div className={styles.cardContent}><span>Total FOB (USD)</span><strong>${fmt(resumen.totalFob)}</strong></div></div>
                <div className={styles.cardLarge}><div className={styles.cardIcon}>🌍</div><div className={styles.cardContent}><span>Países de Origen</span><strong>{reportePais?.length ?? 0}</strong></div></div>
                <div className={styles.cardLarge}><div className={styles.cardIcon}>🏢</div><div className={styles.cardContent}><span>Importadores</span><strong>{reporteImportador?.length ?? 0}</strong></div></div>
                <div className={styles.cardLarge}><div className={styles.cardIcon}>📍</div><div className={styles.cardContent}><span>Departamentos</span><strong>{reporteDepto?.length ?? 0}</strong></div></div>
              </div>
            )}
          </section>

          <div className={styles.chartRowFull}>
            <section className={styles.chartCardWide}>
              <h3>Evolución Mensual de Importaciones</h3>
              {evolucion && (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={evolucion} margin={{ left: 10, right: 30, top: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCif" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E40AF" stopOpacity={0.8}/><stop offset="95%" stopColor="#1E40AF" stopOpacity={0.1}/></linearGradient>
                      <linearGradient id="colorFob" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D97706" stopOpacity={0.8}/><stop offset="95%" stopColor="#D97706" stopOpacity={0.1}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" style={{ fontSize: "0.75rem" }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} style={{ fontSize: "0.75rem" }} />
                    <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, ""]} labelStyle={{ fontWeight: "bold" }} />
                    <Legend />
                    <Area type="monotone" dataKey="totalCif" name="CIF (USD)" stroke="#1E40AF" fillOpacity={1} fill="url(#colorCif)" strokeWidth={2} />
                    <Area type="monotone" dataKey="totalFob" name="FOB (USD)" stroke="#D97706" fillOpacity={1} fill="url(#colorFob)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </section>
          </div>

          <div className={styles.chartRow}>
            <section className={styles.chartCard}>
              <h3>Top 10 Países por CIF {anioFiltro && `(${anioFiltro})`}</h3>
              {reportePais && (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={reportePais.slice(0, 10).map((r) => ({ name: `${getFlag(r.pais ?? "")} ${r.pais}`, CIF: r.totalCif, FOB: r.totalFob }))} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} style={{ fontSize: "0.72rem" }} />
                    <YAxis type="category" dataKey="name" width={130} style={{ fontSize: "0.72rem" }} />
                    <Tooltip formatter={fmtTooltip} />
                    <Legend />
                    <Bar dataKey="CIF" name="CIF" fill="#1E40AF" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="FOB" name="FOB" fill="#93C5FD" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className={styles.chartCard}>
              <h3>Importaciones por Departamento</h3>
              {reporteDepto && (() => {
                const COLORS = ["#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#10B981", "#34D399", "#6EE7B7", "#A3A3A3"];
                const data = reporteDepto.slice(0, 9).map((d) => ({ name: d.departamento, value: d.totalCif }));
                return (
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={2} dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                        labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }} style={{ fontSize: "0.72rem" }}>
                        {data.map((_entry, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, "CIF"]} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </section>
          </div>

          <div className={styles.chartRow}>
            <section className={styles.chartCard}>
              <h3>Top 15 Importadores por CIF</h3>
              {reporteImportador && (
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={reporteImportador.slice(0, 15).map((r) => ({ name: r.importador && r.importador.length > 28 ? r.importador.slice(0, 28) + "..." : r.importador, CIF: r.totalCif }))} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} style={{ fontSize: "0.72rem" }} />
                    <YAxis type="category" dataKey="name" width={200} style={{ fontSize: "0.7rem" }} />
                    <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, "CIF (USD)"]} />
                    <Bar dataKey="CIF" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className={styles.chartCard}>
              <h3>Distribución por Categoría de Producto</h3>
              {categorias && (() => {
                const COLORS = ["#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#D97706", "#F59E0B", "#FBBF24", "#A3A3A3"];
                const data = categorias.map((c) => ({ name: HS_CHAPTERS[c.capitulo] ?? `Cap. ${c.capitulo}`, value: c.totalCif }));
                return (
                  <ResponsiveContainer width="100%" height={450}>
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={150} paddingAngle={2} dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${(name ?? "").slice(0, 18)}${(name ?? "").length > 18 ? "..." : ""} ${((percent ?? 0) * 100).toFixed(1)}%`}
                        labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }} style={{ fontSize: "0.68rem" }}>
                        {data.map((_entry, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, "CIF"]} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </section>
          </div>

          <section className={styles.reportes}>
            <div className={styles.reportHeader}>
              <h3>Datos Detallados</h3>
              <div className={styles.reportTabGroup}>
                <button onClick={() => { setTabReporte("pais"); setPaginaReporte(0); setRptSortCol(null); }} className={`${styles.reportTab} ${tabReporte === "pais" ? styles.btnActive : ""}`}>Por País</button>
                <button onClick={() => { setTabReporte("importador"); setPaginaReporte(0); setRptSortCol(null); }} className={`${styles.reportTab} ${tabReporte === "importador" ? styles.btnActive : ""}`}>Por Importador</button>
                <button onClick={() => { setTabReporte("depto"); setPaginaReporte(0); setRptSortCol(null); }} className={`${styles.reportTab} ${tabReporte === "depto" ? styles.btnActive : ""}`}>Por Departamento</button>
              </div>
            </div>

            <p className={styles.reportCount}>{currentReportPag.total} resultados</p>

            <div className={styles.tablaReporte}>
              {tabReporte === "pais" && reportePais && (
                <table>
                  <thead><tr>
                    <th className={styles.sortable} onClick={() => handleRptSort("pais")}>País{rptSortIndicator("pais")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>Operaciones{rptSortIndicator("cantidadRegistros")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>Total CIF (USD){rptSortIndicator("totalCif")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("totalFob")}>Total FOB (USD){rptSortIndicator("totalFob")}</th>
                    <th>% del Total</th>
                  </tr></thead>
                  <tbody>
                    {paisPag.items.map((r) => {
                      const pct = ((r.totalCif / (resumen?.totalCif ?? 1)) * 100).toFixed(2);
                      return (
                        <tr key={r.pais}>
                          <td>{getFlag(r.pais ?? "")} {r.pais}</td>
                          <td>{r.cantidadRegistros.toLocaleString()}</td>
                          <td>${fmt(r.totalCif)}</td>
                          <td>${fmt(r.totalFob)}</td>
                          <td><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} /><span>{pct}%</span></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {tabReporte === "importador" && reporteImportador && (
                <table>
                  <thead><tr>
                    <th className={styles.sortable} onClick={() => handleRptSort("importador")}>Importador{rptSortIndicator("importador")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("nit")}>NIT{rptSortIndicator("nit")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>Operaciones{rptSortIndicator("cantidadRegistros")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>Total CIF (USD){rptSortIndicator("totalCif")}</th>
                    <th>% del Total</th>
                  </tr></thead>
                  <tbody>
                    {importadorPag.items.map((r, i) => {
                      const pct = ((r.totalCif / (resumen?.totalCif ?? 1)) * 100).toFixed(2);
                      return (
                        <tr key={i}>
                          <td>{r.importador}</td>
                          <td>{r.nit ?? "-"}</td>
                          <td>{r.cantidadRegistros.toLocaleString()}</td>
                          <td>${fmt(r.totalCif)}</td>
                          <td><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} /><span>{pct}%</span></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {tabReporte === "depto" && reporteDepto && (
                <table>
                  <thead><tr>
                    <th className={styles.sortable} onClick={() => handleRptSort("departamento")}>Departamento{rptSortIndicator("departamento")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("cantidadRegistros")}>Operaciones{rptSortIndicator("cantidadRegistros")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("totalCif")}>Total CIF (USD){rptSortIndicator("totalCif")}</th>
                    <th className={styles.sortable} onClick={() => handleRptSort("totalFob")}>Total FOB (USD){rptSortIndicator("totalFob")}</th>
                    <th>% del Total</th>
                  </tr></thead>
                  <tbody>
                    {deptoPag.items.map((r) => {
                      const pct = ((r.totalCif / (resumen?.totalCif ?? 1)) * 100).toFixed(2);
                      return (
                        <tr key={r.departamento}>
                          <td>{r.departamento}</td>
                          <td>{r.cantidadRegistros.toLocaleString()}</td>
                          <td>${fmt(r.totalCif)}</td>
                          <td>${fmt(r.totalFob)}</td>
                          <td><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} /><span>{pct}%</span></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {currentReportPag.totalPages > 1 && (
              <div className={styles.paginacion}>
                <button onClick={() => setPaginaReporte((p) => Math.max(0, p - 1))} disabled={paginaReporte === 0}>Anterior</button>
                <span>Página {paginaReporte + 1} de {currentReportPag.totalPages}</span>
                <button onClick={() => setPaginaReporte((p) => Math.min(currentReportPag.totalPages - 1, p + 1))} disabled={paginaReporte >= currentReportPag.totalPages - 1}>Siguiente</button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
