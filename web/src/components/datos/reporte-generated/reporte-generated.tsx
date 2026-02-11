"use client";

import { useState } from "react";
import { getFlag } from "@/lib/country-flags";
import { HS_CHAPTERS } from "@/lib/hs-chapters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FiltrosState } from "@/hooks/use-filtros-busqueda";
import styles from "./reporte-generated.module.css";

type ReporteData = {
  totalMonto: number;
  totalPesoNeto: number;
  porImportador: { importador: string; monto: number; pesoNeto: number; operaciones: number }[];
  porProveedor: { proveedor: string; pais: string; monto: number; pesoNeto: number; operaciones: number }[];
  porPaisProcedencia: { pais: string; monto: number; pesoNeto: number; operaciones: number }[];
};

type ReporteGeneratedProps = {
  reporteData: ReporteData;
  filtrosForm: FiltrosState;
  subPartidas: { codigo: string; descripcion: string }[] | undefined;
  totalRegistros: number;
  onClose: () => void;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLORS = [
  "#1E40AF", "#D97706", "#10B981", "#7C3AED", "#EC4899",
  "#0891B2", "#DC2626", "#4F46E5", "#059669", "#CA8A04",
  "#BE185D", "#0D9488", "#7C2D12", "#6366F1", "#15803D"
];

export default function ReporteGenerated({
  reporteData,
  filtrosForm,
  subPartidas,
  totalRegistros,
  onClose,
}: ReporteGeneratedProps) {
  const [tabReporteVisual, setTabReporteVisual] = useState<"importadores" | "proveedores" | "paises">("importadores");

  return (
    <section className={styles.reporteVisual}>
      <div className={styles.reporteHeader}>
        <h2>Reporte de Importaciones</h2>
        <button onClick={onClose} className={styles.btnSecondary}>
          Cerrar Reporte
        </button>
      </div>

      {/* Filtros del reporte en formato tabla */}
      <div className={styles.filtrosReporte}>
        <h3>Filtros del Reporte</h3>
        <div className={styles.filtrosGrid}>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>País de Origen:</span>
            <span className={styles.filtroValue}>
              {filtrosForm.paisOrige.length > 0 ? filtrosForm.paisOrige.join(", ") : "Todos"}
            </span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Importador:</span>
            <span className={styles.filtroValue}>{filtrosForm.importador || "Todos"}</span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Descripción:</span>
            <span className={styles.filtroValue}>{filtrosForm.descripcion || "Todos"}</span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Departamento:</span>
            <span className={styles.filtroValue}>{filtrosForm.deptoDes || "Todos"}</span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Partida Arancelaria:</span>
            <span className={styles.filtroValue}>
              {filtrosForm.subPartida
                ? `${filtrosForm.subPartida} - ${subPartidas?.find((sp) => sp.codigo === filtrosForm.subPartida)?.descripcion || ""}`
                : filtrosForm.capitulo
                  ? `${filtrosForm.capitulo} - ${HS_CHAPTERS[filtrosForm.capitulo] || ""}`
                  : "Todas"}
            </span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Fecha Desde:</span>
            <span className={styles.filtroValue}>{filtrosForm.fechaDesde || "Sin límite"}</span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Fecha Hasta:</span>
            <span className={styles.filtroValue}>{filtrosForm.fechaHasta || "Sin límite"}</span>
          </div>
          <div className={styles.filtroItem}>
            <span className={styles.filtroLabel}>Registros encontrados:</span>
            <span className={styles.filtroValue}>
              <strong>{totalRegistros.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.reporteCards}>
        <div className={styles.reporteCard}>
          <span>Total Operaciones</span>
          <strong>{totalRegistros.toLocaleString()}</strong>
        </div>
        <div className={styles.reporteCard}>
          <span>Total CIF (USD)</span>
          <strong>${fmt(reporteData.totalMonto)}</strong>
        </div>
        <div className={styles.reporteCard}>
          <span>Peso Neto Total (Kg)</span>
          <strong>{fmt(reporteData.totalPesoNeto)}</strong>
        </div>
        <div className={styles.reporteCard}>
          <span>Importadores</span>
          <strong>{reporteData.porImportador.length}</strong>
        </div>
        <div className={styles.reporteCard}>
          <span>Proveedores</span>
          <strong>{reporteData.porProveedor.length}</strong>
        </div>
      </div>

      {/* Tabs del reporte */}
      <div className={styles.reporteTabs}>
        <button
          className={`${styles.reporteTabBtn} ${tabReporteVisual === "importadores" ? styles.reporteTabActive : ""}`}
          onClick={() => setTabReporteVisual("importadores")}
        >
          Importadores
        </button>
        <button
          className={`${styles.reporteTabBtn} ${tabReporteVisual === "proveedores" ? styles.reporteTabActive : ""}`}
          onClick={() => setTabReporteVisual("proveedores")}
        >
          Proveedores
        </button>
        <button
          className={`${styles.reporteTabBtn} ${tabReporteVisual === "paises" ? styles.reporteTabActive : ""}`}
          onClick={() => setTabReporteVisual("paises")}
        >
          Países de Procedencia
        </button>
      </div>

      {/* Tab: Importadores */}
      {tabReporteVisual === "importadores" && (
        <div className={styles.reporteTabContent}>
          <h3>Lista de Importadores</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.tablaDatos}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Importador</th>
                  <th>Monto USD</th>
                  <th>Peso Neto (Kg)</th>
                  <th>% Monto</th>
                </tr>
              </thead>
              <tbody>
                {reporteData.porImportador.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.importador}</td>
                    <td className={styles.numericCell}>${fmt(r.monto)}</td>
                    <td className={styles.numericCell}>{fmt(r.pesoNeto)}</td>
                    <td className={styles.numericCell}>
                      {((r.monto / reporteData.totalMonto) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Proveedores */}
      {tabReporteVisual === "proveedores" && (
        <div className={styles.reporteTabContent}>
          <h3>Lista de Proveedores</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.tablaDatos}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Proveedor</th>
                  <th>País</th>
                  <th>Operaciones</th>
                  <th>Monto USD</th>
                  <th>Peso Neto (Kg)</th>
                  <th>% Monto</th>
                </tr>
              </thead>
              <tbody>
                {reporteData.porProveedor.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.proveedor}</td>
                    <td>
                      {getFlag(r.pais)} {r.pais}
                    </td>
                    <td className={styles.numericCell}>{r.operaciones.toLocaleString()}</td>
                    <td className={styles.numericCell}>${fmt(r.monto)}</td>
                    <td className={styles.numericCell}>{fmt(r.pesoNeto)}</td>
                    <td className={styles.numericCell}>
                      {((r.monto / reporteData.totalMonto) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfica de barras horizontales por proveedor */}
          {reporteData.porProveedor.length > 0 && (() => {
            const chartData = reporteData.porProveedor.slice(0, 10).map((r, i) => ({
              proveedor: r.proveedor.length > 25 ? r.proveedor.slice(0, 22) + "..." : r.proveedor,
              fullName: r.proveedor,
              pais: r.pais,
              porcentaje: Number(((r.monto / reporteData.totalMonto) * 100).toFixed(2)),
              monto: r.monto,
              fill: COLORS[i % COLORS.length],
            }));
            return (
              <div className={styles.chartCardWide}>
                <h3>Top 10 Proveedores por Monto (%)</h3>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 20, right: 30, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${v}%`}
                      style={{ fontSize: "0.75rem" }}
                      tick={{ fill: "#374151" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="proveedor"
                      width={180}
                      interval={0}
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                      tick={{ fill: "#374151" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={styles.customTooltip} style={{ borderColor: data.fill }}>
                              <p className={styles.tooltipTitle} style={{ color: data.fill }}>
                                {data.fullName}
                              </p>
                              <p>País: <strong>{data.pais}</strong></p>
                              <p>Porcentaje: <strong>{data.porcentaje}%</strong></p>
                              <p>Monto: <strong>${fmt(data.monto)}</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="porcentaje" name="Porcentaje" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Países de Procedencia */}
      {tabReporteVisual === "paises" && (
        <div className={styles.reporteTabContent}>
          <h3>Países de Procedencia</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.tablaDatos}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>País</th>
                  <th>Monto USD</th>
                  <th>Peso Neto (Kg)</th>
                  <th>% Monto</th>
                </tr>
              </thead>
              <tbody>
                {reporteData.porPaisProcedencia.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {getFlag(r.pais)} {r.pais}
                    </td>
                    <td className={styles.numericCell}>${fmt(r.monto)}</td>
                    <td className={styles.numericCell}>{fmt(r.pesoNeto)}</td>
                    <td className={styles.numericCell}>
                      {((r.monto / reporteData.totalMonto) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfica de barras horizontales por país */}
          {reporteData.porPaisProcedencia.length > 0 && (() => {
            const chartData = reporteData.porPaisProcedencia.slice(0, 10).map((r, i) => ({
              pais: r.pais.length > 20 ? r.pais.slice(0, 18) + "..." : r.pais,
              fullName: r.pais,
              porcentaje: Number(((r.monto / reporteData.totalMonto) * 100).toFixed(2)),
              monto: r.monto,
              fill: COLORS[i % COLORS.length],
            }));
            return (
              <div className={styles.chartCardWide}>
                <h3>Distribución por País (%)</h3>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 20, right: 30, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${v}%`}
                      style={{ fontSize: "0.75rem" }}
                      tick={{ fill: "#374151" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="pais"
                      width={150}
                      interval={0}
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                      tick={{ fill: "#374151" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={styles.customTooltip} style={{ borderColor: data.fill }}>
                              <p className={styles.tooltipTitle} style={{ color: data.fill }}>
                                {data.fullName}
                              </p>
                              <p>Porcentaje: <strong>{data.porcentaje}%</strong></p>
                              <p>Monto: <strong>${fmt(data.monto)}</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="porcentaje" name="Porcentaje" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
