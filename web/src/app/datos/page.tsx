"use client";

import { useState, useMemo } from "react";
import { useFiltrosBusqueda } from "@/hooks/use-filtros-busqueda";
import HeaderFilter from "@/components/datos/header-filter";
import DatosList from "@/components/datos/datos-list";
import { ReporteGenerated } from "@/components/datos/reporte-generated";
import { ReporteTab } from "@/components/reportes";
import styles from "./page.module.css";

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
      {tabPrincipal === "reportes" && <ReporteTab />}
    </div>
  );
}
