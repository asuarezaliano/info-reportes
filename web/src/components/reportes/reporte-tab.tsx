"use client";

import { useReportes } from "@/hooks/use-reportes";
import { ReporteHeader } from "./header";
import { ReporteGraficas } from "./graficas";
import { ReporteLista } from "./lista";

export default function ReporteTab() {
  const {
    // Filter state
    fechaDesdeReporte,
    setFechaDesdeReporte,
    fechaHastaReporte,
    setFechaHastaReporte,
    filtroFechaDesde,
    filtroFechaHasta,
    handleAplicarFiltro,
    handleLimpiarFiltro,

    // Tab state
    tabReporte,
    setTabReporte,

    // Pagination
    paginaReporte,
    setPaginaReporte,

    // Sorting
    handleRptSort,
    rptSortIndicator,

    // Data
    resumen,
    reportePais,
    reporteImportador,
    reporteDepto,
    evolucion,
    categorias,

    // Paginated data
    paisPag,
    importadorPag,
    deptoPag,
    currentReportPag,
  } = useReportes();

  return (
    <>
      <ReporteHeader
        fechaDesdeReporte={fechaDesdeReporte}
        setFechaDesdeReporte={setFechaDesdeReporte}
        fechaHastaReporte={fechaHastaReporte}
        setFechaHastaReporte={setFechaHastaReporte}
        filtroFechaDesde={filtroFechaDesde}
        filtroFechaHasta={filtroFechaHasta}
        onAplicar={handleAplicarFiltro}
        onLimpiar={handleLimpiarFiltro}
        resumen={resumen}
        totalPaises={reportePais?.length ?? 0}
        totalImportadores={reporteImportador?.length ?? 0}
        totalDepartamentos={reporteDepto?.length ?? 0}
      />

      <ReporteGraficas
        reportePais={reportePais}
        reporteImportador={reporteImportador}
        reporteDepto={reporteDepto}
        evolucion={evolucion}
        categorias={categorias}
        filtroFechaDesde={filtroFechaDesde}
        filtroFechaHasta={filtroFechaHasta}
      />

      <ReporteLista
        tabReporte={tabReporte}
        setTabReporte={setTabReporte}
        resumen={resumen}
        paisPag={paisPag}
        importadorPag={importadorPag}
        deptoPag={deptoPag}
        currentReportPag={currentReportPag}
        paginaReporte={paginaReporte}
        setPaginaReporte={setPaginaReporte}
        handleRptSort={handleRptSort}
        rptSortIndicator={rptSortIndicator}
      />
    </>
  );
}
