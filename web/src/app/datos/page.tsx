"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFiltrosBusqueda } from "@/hooks/use-filtros-busqueda";
import { getAuthToken } from "@/lib/auth-token";
import HeaderFilter from "@/components/datos/header-filter";
import DatosList from "@/components/datos/datos-list";
import { ReporteGenerated } from "@/components/datos/reporte-generated";
import { ReporteTab } from "@/components/reportes";
import { Logo } from "@/components/ui";
import styles from "./page.module.css";

export default function DatosPage() {
  const router = useRouter();
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  // Main tab
  const [tabPrincipal, setTabPrincipal] = useState<"busqueda" | "reportes">(
    "busqueda",
  );

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
    reporteData,
    filterOptions,
    subPartidas,
    chapterList,
    handleBuscar,
    handleLimpiar,
    mostrarReporte,
    setMostrarReporte,
    handleGenerarReporte,
  } = useFiltrosBusqueda();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Datos Aduaneros</h1>
        </div>
        <Logo size={140} />
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
