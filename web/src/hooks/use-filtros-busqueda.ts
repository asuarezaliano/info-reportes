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
  descripcion: string;
  capitulo: string;
  subPartida: string;
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

  // Handlers
  const handleBuscar = useCallback((e: React.FormEvent) => {
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
    setMostrarReporte(false);
  }, [paisOrige, importador, descripcion, deptoDes, subPartida, capitulo, fechaDesde, fechaHasta]);

  const handleLimpiar = useCallback(() => {
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
