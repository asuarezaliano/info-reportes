"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  reportePorPais,
  reportePorImportador,
  reportePorDepartamento,
  resumenGeneral,
  evolucionMensual,
  topCategorias,
  type ReportePais,
  type ReporteImportador,
  type ReporteDepartamento,
  type ResumenGeneral,
  type EvolucionMensual,
  type TopCategoria,
} from "@/services/declaraciones.service";

const REPORTE_PAGE_SIZE = 100;

export type TabReporte = "pais" | "importador" | "depto";

export type UseReportesReturn = {
  // Filter state
  fechaDesdeReporte: string;
  setFechaDesdeReporte: (v: string) => void;
  fechaHastaReporte: string;
  setFechaHastaReporte: (v: string) => void;
  filtroFechaDesde: string;
  filtroFechaHasta: string;
  
  // Tab state
  tabReporte: TabReporte;
  setTabReporte: (tab: TabReporte) => void;
  
  // Pagination
  paginaReporte: number;
  setPaginaReporte: React.Dispatch<React.SetStateAction<number>>;
  
  // Sorting
  rptSortCol: string | null;
  rptSortDir: "asc" | "desc";
  handleRptSort: (col: string) => void;
  rptSortIndicator: (col: string) => string;
  
  // Data
  resumen: ResumenGeneral | undefined;
  reportePais: ReportePais[] | undefined;
  reporteImportador: ReporteImportador[] | undefined;
  reporteDepto: ReporteDepartamento[] | undefined;
  evolucion: EvolucionMensual[] | undefined;
  categorias: TopCategoria[] | undefined;
  
  // Paginated data
  paisPag: PaginatedData<ReportePais>;
  importadorPag: PaginatedData<ReporteImportador>;
  deptoPag: PaginatedData<ReporteDepartamento>;
  currentReportPag: PaginatedData<ReportePais | ReporteImportador | ReporteDepartamento>;
  
  // Actions
  handleAplicarFiltro: () => void;
  handleLimpiarFiltro: () => void;
};

type PaginatedData<T> = {
  items: T[];
  total: number;
  totalPages: number;
};

export function useReportes(): UseReportesReturn {
  // Filter state
  const [fechaDesdeReporte, setFechaDesdeReporte] = useState("");
  const [fechaHastaReporte, setFechaHastaReporte] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  // Tab state
  const [tabReporte, setTabReporteState] = useState<TabReporte>("pais");

  // Pagination
  const [paginaReporte, setPaginaReporte] = useState(0);

  // Sorting
  const [rptSortCol, setRptSortCol] = useState<string | null>(null);
  const [rptSortDir, setRptSortDir] = useState<"asc" | "desc">("asc");

  // Queries
  const { data: resumen } = useQuery({
    queryKey: ["resumen", filtroFechaDesde, filtroFechaHasta],
    queryFn: () => resumenGeneral(filtroFechaDesde || undefined, filtroFechaHasta || undefined),
  });

  const { data: reportePaisData } = useQuery({
    queryKey: ["reporte-pais", filtroFechaDesde, filtroFechaHasta],
    queryFn: () => reportePorPais(filtroFechaDesde || undefined, filtroFechaHasta || undefined),
  });

  const { data: reporteImportadorData } = useQuery({
    queryKey: ["reporte-importador", filtroFechaDesde, filtroFechaHasta],
    queryFn: () => reportePorImportador(filtroFechaDesde || undefined, filtroFechaHasta || undefined),
  });

  const { data: reporteDeptoData } = useQuery({
    queryKey: ["reporte-depto", filtroFechaDesde, filtroFechaHasta],
    queryFn: () => reportePorDepartamento(filtroFechaDesde || undefined, filtroFechaHasta || undefined),
  });

  const { data: evolucion } = useQuery({
    queryKey: ["evolucion-mensual"],
    queryFn: evolucionMensual,
  });

  const { data: categorias } = useQuery({
    queryKey: ["top-categorias"],
    queryFn: () => topCategorias(8),
  });

  // Handlers
  const setTabReporte = useCallback((tab: TabReporte) => {
    setTabReporteState(tab);
    setPaginaReporte(0);
    setRptSortCol(null);
  }, []);

  const handleRptSort = useCallback((col: string) => {
    if (rptSortCol === col) {
      setRptSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setRptSortCol(col);
      setRptSortDir("asc");
    }
    setPaginaReporte(0);
  }, [rptSortCol]);

  const rptSortIndicator = useCallback((col: string) => {
    return rptSortCol === col ? (rptSortDir === "asc" ? " ▲" : " ▼") : "";
  }, [rptSortCol, rptSortDir]);

  const handleAplicarFiltro = useCallback(() => {
    setFiltroFechaDesde(fechaDesdeReporte);
    setFiltroFechaHasta(fechaHastaReporte);
    setPaginaReporte(0);
  }, [fechaDesdeReporte, fechaHastaReporte]);

  const handleLimpiarFiltro = useCallback(() => {
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setFechaDesdeReporte("");
    setFechaHastaReporte("");
  }, []);

  // Sort and paginate helper
  const sortAndPaginate = useCallback(<T extends Record<string, unknown>>(data: T[] | undefined): PaginatedData<T> => {
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
  }, [paginaReporte, rptSortCol, rptSortDir]);

  // Paginated data
  const paisPag = useMemo(() => sortAndPaginate(reportePaisData), [sortAndPaginate, reportePaisData]);
  const importadorPag = useMemo(() => sortAndPaginate(reporteImportadorData), [sortAndPaginate, reporteImportadorData]);
  const deptoPag = useMemo(() => sortAndPaginate(reporteDeptoData), [sortAndPaginate, reporteDeptoData]);

  const currentReportPag = tabReporte === "pais" ? paisPag : tabReporte === "importador" ? importadorPag : deptoPag;

  return {
    // Filter state
    fechaDesdeReporte,
    setFechaDesdeReporte,
    fechaHastaReporte,
    setFechaHastaReporte,
    filtroFechaDesde,
    filtroFechaHasta,

    // Tab state
    tabReporte,
    setTabReporte,

    // Pagination
    paginaReporte,
    setPaginaReporte,

    // Sorting
    rptSortCol,
    rptSortDir,
    handleRptSort,
    rptSortIndicator,

    // Data
    resumen,
    reportePais: reportePaisData,
    reporteImportador: reporteImportadorData,
    reporteDepto: reporteDeptoData,
    evolucion,
    categorias,

    // Paginated data
    paisPag,
    importadorPag,
    deptoPag,
    currentReportPag,

    // Actions
    handleAplicarFiltro,
    handleLimpiarFiltro,
  };
}
