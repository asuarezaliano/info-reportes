"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { getFlag } from "@/lib/country-flags";
import { HS_CHAPTERS } from "@/lib/hs-chapters";
import type {
  ReportePais,
  ReporteImportador,
  ReporteDepartamento,
  EvolucionMensual,
  TopCategoria,
} from "@/services/declaraciones.service";
import styles from "./reporte-graficas.module.css";

type ReporteGraficasProps = {
  reportePais: ReportePais[] | undefined;
  reporteImportador: ReporteImportador[] | undefined;
  reporteDepto: ReporteDepartamento[] | undefined;
  evolucion: EvolucionMensual[] | undefined;
  categorias: TopCategoria[] | undefined;
  filtroFechaDesde: string;
  filtroFechaHasta: string;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtTooltip = (v: number | undefined) => [
  `$${v != null ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0"}`,
  "",
];

const COLORS_PIE = [
  "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD",
  "#10B981", "#34D399", "#6EE7B7", "#A3A3A3",
];

const COLORS_CATEGORIAS = [
  "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD",
  "#D97706", "#F59E0B", "#FBBF24", "#A3A3A3",
];

export default function ReporteGraficas({
  reportePais,
  reporteImportador,
  reporteDepto,
  evolucion,
  categorias,
  filtroFechaDesde,
  filtroFechaHasta,
}: ReporteGraficasProps) {
  return (
    <>
      {/* Evolución Mensual */}
      <div className={styles.chartRowFull}>
        <section className={styles.chartCardWide}>
          <h3>Evolución Mensual de Importaciones</h3>
          {evolucion && (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={evolucion} margin={{ left: 10, right: 30, top: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorFob" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" style={{ fontSize: "0.75rem" }} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                  style={{ fontSize: "0.75rem" }}
                />
                <Tooltip
                  formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, ""]}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalCif"
                  name="CIF (USD)"
                  stroke="#1E40AF"
                  fillOpacity={1}
                  fill="url(#colorCif)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="totalFob"
                  name="FOB (USD)"
                  stroke="#D97706"
                  fillOpacity={1}
                  fill="url(#colorFob)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      {/* Row: Top Países + Departamentos */}
      <div className={styles.chartRow}>
        <section className={styles.chartCard}>
          <h3>
            Top 10 Países por CIF{" "}
            {filtroFechaDesde && filtroFechaHasta && `(${filtroFechaDesde} - ${filtroFechaHasta})`}
          </h3>
          {reportePais && (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={reportePais.slice(0, 10).map((r) => ({
                  name: `${getFlag(r.pais ?? "")} ${r.pais}`,
                  CIF: r.totalCif,
                  FOB: r.totalFob,
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                  style={{ fontSize: "0.72rem" }}
                />
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
            const data = reporteDepto.slice(0, 9).map((d) => ({
              name: d.departamento,
              value: d.totalCif,
            }));
            return (
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
                    labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                    style={{ fontSize: "0.72rem" }}
                  >
                    {data.map((_entry, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, "CIF"]} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </section>
      </div>

      {/* Row: Top Importadores + Categorías */}
      <div className={styles.chartRow}>
        <section className={styles.chartCard}>
          <h3>Top 15 Importadores por CIF</h3>
          {reporteImportador && (
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={reporteImportador.slice(0, 15).map((r) => ({
                  name:
                    r.importador && r.importador.length > 28
                      ? r.importador.slice(0, 28) + "..."
                      : r.importador,
                  CIF: r.totalCif,
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                  style={{ fontSize: "0.72rem" }}
                />
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
            const data = categorias.map((c) => ({
              name: HS_CHAPTERS[c.capitulo] ?? `Cap. ${c.capitulo}`,
              value: c.totalCif,
            }));
            return (
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={150}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${(name ?? "").slice(0, 18)}${(name ?? "").length > 18 ? "..." : ""} ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
                    labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
                    style={{ fontSize: "0.68rem" }}
                  >
                    {data.map((_entry, i) => (
                      <Cell key={i} fill={COLORS_CATEGORIAS[i % COLORS_CATEGORIAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | undefined) => [`$${fmt(v ?? 0)}`, "CIF"]} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </section>
      </div>
    </>
  );
}
