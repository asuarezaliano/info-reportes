"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getFlag } from "@/lib/country-flags";
import styles from "./paises-donut-chart.module.css";

type PaisData = {
  pais: string;
  monto: number;
  pesoNeto: number;
};

type PaisesDonutChartProps = {
  data: PaisData[];
  totalMonto: number;
  maxItems?: number;
};

const COLORS = [
  "#1E3A8A", "#2563EB", "#3B82F6", "#0EA5E9", "#06B6D4",
  "#1E40AF", "#4F46E5", "#6366F1", "#0284C7", "#0891B2",
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PaisesDonutChart({
  data,
  totalMonto,
  maxItems = 10,
}: PaisesDonutChartProps) {
  const chartData = data.slice(0, maxItems).map((r, i) => ({
    name: r.pais,
    displayName: `${getFlag(r.pais)} ${r.pais}`,
    value: r.monto,
    porcentaje: Number(((r.monto / totalMonto) * 100).toFixed(2)),
    fill: COLORS[i % COLORS.length],
  }));

  // Si hay más países fuera del top, los agrupo en "Otros"
  if (data.length > maxItems) {
    const otrosMonto = data
      .slice(maxItems)
      .reduce((sum, r) => sum + r.monto, 0);
    chartData.push({
      name: "Otros",
      displayName: "🌐 Otros",
      value: otrosMonto,
      porcentaje: Number(((otrosMonto / totalMonto) * 100).toFixed(2)),
      fill: "#94a3b8",
    });
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    if (percent < 0.05) return null; // No mostrar label si es menos de 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: "0.75rem", fontWeight: 500 }}
      >
        {`${getFlag(name)} ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Distribución por País de Procedencia</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={420}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={150}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className={styles.tooltip} style={{ borderColor: d.fill }}>
                      <p className={styles.tooltipTitle} style={{ color: d.fill }}>
                        {d.displayName}
                      </p>
                      <p>Porcentaje: <strong>{d.porcentaje}%</strong></p>
                      <p>Monto: <strong>${fmt(d.value)}</strong></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={10}
              formatter={(value, entry) => {
                const d = entry.payload as { displayName?: string; porcentaje?: number };
                return (
                  <span className={styles.legendItem}>
                    {d.displayName} <span className={styles.legendPercent}>({d.porcentaje}%)</span>
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
