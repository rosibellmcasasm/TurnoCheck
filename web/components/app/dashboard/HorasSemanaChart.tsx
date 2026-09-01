"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export interface BarraHoras {
  etiqueta: string;
  horas: number;
}

export function HorasSemanaChart({ datos }: { datos: BarraHoras[] }) {
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} barCategoryGap={14}>
          <XAxis
            dataKey="etiqueta"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
          <Bar dataKey="horas" radius={[5, 5, 0, 0]} fill="var(--primary)" maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
