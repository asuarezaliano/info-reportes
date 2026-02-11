"use client";

import type { ResumenGeneral } from "@/services/declaraciones.service";
import styles from "./reporte-header.module.css";

type ReporteHeaderProps = {
  // Filter state
  fechaDesdeReporte: string;
  setFechaDesdeReporte: (v: string) => void;
  fechaHastaReporte: string;
  setFechaHastaReporte: (v: string) => void;
  filtroFechaDesde: string;
  filtroFechaHasta: string;
  onAplicar: () => void;
  onLimpiar: () => void;
  // Summary data
  resumen: ResumenGeneral | undefined;
  totalPaises: number;
  totalImportadores: number;
  totalDepartamentos: number;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReporteHeader({
  fechaDesdeReporte,
  setFechaDesdeReporte,
  fechaHastaReporte,
  setFechaHastaReporte,
  filtroFechaDesde,
  filtroFechaHasta,
  onAplicar,
  onLimpiar,
  resumen,
  totalPaises,
  totalImportadores,
  totalDepartamentos,
}: ReporteHeaderProps) {
  return (
    <>
      <section className={styles.reportFilterBar}>
        <div className={styles.reportFilterGroup}>
          <label>Filtrar por período:</label>
          <div className={styles.datePickerGroup}>
            <div className={styles.datePickerItem}>
              <span>Desde</span>
              <input
                type="date"
                value={fechaDesdeReporte}
                onChange={(e) => setFechaDesdeReporte(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.datePickerItem}>
              <span>Hasta</span>
              <input
                type="date"
                value={fechaHastaReporte}
                onChange={(e) => setFechaHastaReporte(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>
          <button onClick={onAplicar} className={styles.btnPrimary}>
            Aplicar
          </button>
          {(filtroFechaDesde || filtroFechaHasta) && (
            <button onClick={onLimpiar} className={styles.btnSecondary}>
              Limpiar
            </button>
          )}
        </div>
        {(filtroFechaDesde || filtroFechaHasta) && (
          <span className={styles.filterBadge}>
            Filtrando: {filtroFechaDesde && `Desde ${filtroFechaDesde}`}{" "}
            {filtroFechaHasta && `Hasta ${filtroFechaHasta}`}
          </span>
        )}
      </section>

      <section className={styles.resumen}>
        {resumen && (
          <div className={styles.cardsGrid}>
            <div className={styles.cardLarge}>
              <div className={styles.cardIcon}>📊</div>
              <div className={styles.cardContent}>
                <span>Total Operaciones</span>
                <strong>{resumen.totalRegistros.toLocaleString()}</strong>
              </div>
            </div>
            <div className={styles.cardLarge}>
              <div className={styles.cardIcon}>💵</div>
              <div className={styles.cardContent}>
                <span>Total CIF (USD)</span>
                <strong>${fmt(resumen.totalCif)}</strong>
              </div>
            </div>
            <div className={styles.cardLarge}>
              <div className={styles.cardIcon}>📦</div>
              <div className={styles.cardContent}>
                <span>Total FOB (USD)</span>
                <strong>${fmt(resumen.totalFob)}</strong>
              </div>
            </div>
            <div className={styles.cardLarge}>
              <div className={styles.cardIcon}>🌍</div>
              <div className={styles.cardContent}>
                <span>Países de Origen</span>
                <strong>{totalPaises}</strong>
              </div>
            </div>
            <div className={styles.cardLarge}>
              <div className={styles.cardIcon}>🏢</div>
              <div className={styles.cardContent}>
                <span>Importadores</span>
                <strong>{totalImportadores}</strong>
              </div>
            </div>
            <div className={styles.cardLarge}>
              <div className={styles.cardIcon}>📍</div>
              <div className={styles.cardContent}>
                <span>Departamentos</span>
                <strong>{totalDepartamentos}</strong>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
