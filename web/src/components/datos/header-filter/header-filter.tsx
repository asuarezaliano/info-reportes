"use client";

import MultiSelectCountry from "@/components/multi-select-country";
import type { FiltrosState } from "@/hooks/use-filtros-busqueda";
import styles from "./header-filter.module.css";

type HeaderFilterProps = {
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
  filterOptions: { paises: string[]; departamentos: string[] } | undefined;
  subPartidas: { codigo: string; descripcion: string }[] | undefined;
  chapterList: { code: string; label: string }[];
  onBuscar: (e: React.FormEvent) => void;
  onLimpiar: () => void;
  onGenerarReporte: () => void;
  canGenerateReport: boolean;
};

export default function HeaderFilter({
  filtrosForm,
  setFiltrosForm,
  filterOptions,
  subPartidas,
  chapterList,
  onBuscar,
  onLimpiar,
  onGenerarReporte,
  canGenerateReport,
}: HeaderFilterProps) {
  const {
    paisOrige,
    deptoDes,
    fechaDesde,
    fechaHasta,
    importador,
    descripcion,
    capitulo,
    subPartida,
  } = filtrosForm;

  const {
    setPaisOrige,
    setDeptoDes,
    setFechaDesde,
    setFechaHasta,
    setImportador,
    setDescripcion,
    setCapitulo,
    setSubPartida,
  } = setFiltrosForm;

  return (
    <section className={styles.busqueda}>
      <h2>Filtros de Búsqueda</h2>
      <form onSubmit={onBuscar} className={styles.filterGrid}>
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
            <label className={styles.filterLabel}>Descripción producto</label>
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
              onChange={(e) => setCapitulo(e.target.value)}
              className={styles.select}
            >
              <option value="">Todas las categorías</option>
              {chapterList.map((ch) => (
                <option key={ch.code} value={ch.code}>
                  {ch.label}
                </option>
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
                  {sp.descripcion.length > 50
                    ? sp.descripcion.slice(0, 50) + "..."
                    : sp.descripcion}
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
          <button type="button" onClick={onLimpiar} className={styles.btnSecondary}>
            Limpiar
          </button>
          <button
            type="button"
            onClick={onGenerarReporte}
            disabled={!canGenerateReport}
            className={styles.btnExport}
          >
            Generar Reporte
          </button>
        </div>
      </form>
    </section>
  );
}
