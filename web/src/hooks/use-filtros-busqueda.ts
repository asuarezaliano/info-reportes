"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buscarDeclaraciones,
  getFilterOptions,
  getSubPartidas,
  type FiltrosBusqueda,
  type ListadoResultado,
} from "@/services/declaraciones.service";
import { getChapterList } from "@/lib/hs-chapters";

export type FiltrosState = {
  paisOrige: string[];
  deptoDes: string;
  fechaDesde: string;
  fechaHasta: string;
  importador: string;
  proveedor: string;
  descripcion: string;
  capitulo: string;
  subPartida: string;
};

export type ReporteDataBusqueda = {
  totalMonto: number;
  totalPesoNeto: number;
  porImportador: { importador: string; monto: number; pesoNeto: number; operaciones: number }[];
  porProveedor: { proveedor: string; pais: string; monto: number; pesoNeto: number; operaciones: number }[];
  porPaisProcedencia: { pais: string; monto: number; pesoNeto: number; operaciones: number }[];
  chartPorMes: Record<string, string | number>[];
  topPaises: string[];
};

export type UseFiltrosBusquedaReturn = {
  // Filter form state
  filtrosForm: FiltrosState;
  setFiltrosForm: {
    setPaisOrige: (value: string[]) => void;
    setDeptoDes: (value: string) => void;
    setFechaDesde: (value: string) => void;
    setFechaHasta: (value: string) => void;
    setImportador: (value: string) => void;
    setProveedor: (value: string) => void;
    setDescripcion: (value: string) => void;
    setCapitulo: (value: string) => void;
    setSubPartida: (value: string) => void;
  };

  // Applied filters (for API calls)
  filtros: FiltrosBusqueda;

  // Pagination and sorting
  pagina: number;
  setPagina: React.Dispatch<React.SetStateAction<number>>;
  sortCol: string | null;
  sortDir: "asc" | "desc";
  handleSort: (col: string) => void;

  // Data
  listado: ListadoResultado | undefined;
  isLoading: boolean;
  totalPaginas: number;
  reporteData: ReporteDataBusqueda | null;

  // Filter options
  filterOptions: { paises: string[]; departamentos: string[] } | undefined;
  subPartidas: { codigo: string; descripcion: string }[] | undefined;
  chapterList: { code: string; label: string }[];

  // Actions
  handleBuscar: (e: React.FormEvent) => void;
  handleLimpiar: () => void;

  // Report state
  mostrarReporte: boolean;
  setMostrarReporte: (value: boolean) => void;
  handleGenerarReporte: () => void;
};

export function useFiltrosBusqueda(): UseFiltrosBusquedaReturn {
  // Applied filters state (for API calls)
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({ limit: 100 });
  const [pagina, setPagina] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Filter form state
  const [paisOrige, setPaisOrige] = useState<string[]>([]);
  const [deptoDes, setDeptoDes] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [importador, setImportador] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capitulo, setCapitulo] = useState("");
  const [subPartida, setSubPartida] = useState("");

  // Report visual state
  const [mostrarReporte, setMostrarReporte] = useState(false);

  // Load filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subPartidas } = useQuery({
    queryKey: ["sub-partidas", capitulo],
    queryFn: () => getSubPartidas(capitulo),
    enabled: capitulo.length === 2,
    staleTime: 5 * 60 * 1000,
  });

  const chapterList = useMemo(() => getChapterList(), []);

  // Main data query
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

  const totalPaginas = listado ? Math.ceil(listado.total / (filtros.limit || 100)) : 0;

  // Compute report data from listado (for search tab report)
  const reporteData = useMemo((): ReporteDataBusqueda | null => {
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

  // Handlers
  const handleBuscar = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFiltros({
      pais_orige: paisOrige.length > 0 ? paisOrige.join(",") : undefined,
      importador: importador || undefined,
      proveedor: proveedor || undefined,
      descripcion: descripcion || undefined,
      depto_des: deptoDes || undefined,
      partida_ar: subPartida || capitulo || undefined,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      limit: 100,
    });
    setPagina(0);
    setMostrarReporte(false);
  }, [paisOrige, importador, proveedor, descripcion, deptoDes, subPartida, capitulo, fechaDesde, fechaHasta]);

  const handleLimpiar = useCallback(() => {
    setPaisOrige([]);
    setDeptoDes("");
    setFechaDesde("");
    setFechaHasta("");
    setImportador("");
    setProveedor("");
    setDescripcion("");
    setCapitulo("");
    setSubPartida("");
    setFiltros({ limit: 100 });
    setPagina(0);
    setMostrarReporte(false);
  }, []);

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPagina(0);
  }, [sortCol]);

  const handleGenerarReporte = useCallback(() => {
    setMostrarReporte(true);
  }, []);

  // Custom setCapitulo that also resets subPartida
  const handleSetCapitulo = useCallback((value: string) => {
    setCapitulo(value);
    setSubPartida("");
  }, []);

  return {
    filtrosForm: {
      paisOrige,
      deptoDes,
      fechaDesde,
      fechaHasta,
      importador,
      proveedor,
      descripcion,
      capitulo,
      subPartida,
    },
    setFiltrosForm: {
      setPaisOrige,
      setDeptoDes,
      setFechaDesde,
      setFechaHasta,
      setImportador,
      setProveedor,
      setDescripcion,
      setCapitulo: handleSetCapitulo,
      setSubPartida,
    },
    filtros,
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
  };
}
