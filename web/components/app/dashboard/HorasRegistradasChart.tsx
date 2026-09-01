"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export interface BarraHoras {
  etiqueta: string;
  horas: number;
}

export function HorasRegistradasChart({ datos }: { datos: BarraHoras[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} barCategoryGap={datos.length > 10 ? 2 : 14}>
          <XAxis
            dataKey="etiqueta"
            axisLine={false}
            tickLine={false}
            interval={datos.length > 10 ? Math.ceil(datos.length / 15) : 0}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--secondary)" }}
            formatter={(valor) => [`${Number(valor).toFixed(1)}h`, "Horas"]}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 12,
              background: "var(--card)",
            }}
          />
          <Bar dataKey="horas" radius={[4, 4, 0, 0]} fill="var(--success)" maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
