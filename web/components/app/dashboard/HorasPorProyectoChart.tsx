"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface ProyectoHoras {
  nombre: string;
  horas: number;
}

const COLORES = ["#2554C7", "#5B85E0", "#8FB0EE", "#B7CCF4", "#1E824C", "#B4790F", "#7C3AED", "#DB2777"];

export function HorasPorProyectoChart({ datos }: { datos: ProyectoHoras[] }) {
  const total = datos.reduce((s, d) => s + d.horas, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="horas"
              nameKey="nombre"
              innerRadius={42}
              outerRadius={62}
              paddingAngle={datos.length > 1 ? 2 : 0}
              strokeWidth={0}
            >
              {datos.map((d, i) => (
                <Cell key={d.nombre} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor, nombre) => [`${Number(valor).toFixed(1)}h`, String(nombre)]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 12,
                background: "var(--card)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-base font-extrabold text-foreground">{total.toFixed(0)}h</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {datos.slice(0, 5).map((d, i) => (
          <div key={d.nombre} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLORES[i % COLORES.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.nombre}</span>
            <span className="tabular shrink-0 font-medium text-foreground">{d.horas.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
