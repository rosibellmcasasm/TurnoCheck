import { ShieldCheck, FileDown, MessageCircle } from "lucide-react";

/** Reproducciones fieles de las pantallas REALES de la app (mismos tokens,
 *  misma estructura que /app y /app/reportes) — no son captura de pantalla
 *  literal porque esas rutas exigen sesión iniciada, pero el mecanismo y el
 *  diseño son exactos a los de la app construida (nivel 2 de la jerarquía
 *  de mockups honestos de 19-PAGINA-DE-VENTAS.md). */

export function ScreenHoy() {
  return (
    <div className="flex h-full flex-col bg-background p-4 font-body">
      <p className="text-[10px] text-muted-foreground">martes, 28 de julio</p>
      <p className="font-display text-sm font-extrabold text-foreground">
        Hola, Restaurante El Fogón
      </p>
      <div className="mt-3 rounded-xl bg-primary p-3 text-primary-foreground">
        <p className="text-[9px] uppercase tracking-wide opacity-80">Nómina de hoy en vivo</p>
        <p className="tabular text-xl font-extrabold">$486.200</p>
        <p className="text-[10px] opacity-85">3 de 5 empleados ya marcaron</p>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Asistencia de hoy
      </p>
      <div className="mt-2 space-y-1.5">
        {[
          { n: "Carlos Ramírez", s: "A tiempo", ok: true },
          { n: "Mónica Torres", s: "+15 min", ok: false },
          { n: "Andrés Gil", s: "Sin marcar", ok: null },
        ].map((r) => (
          <div key={r.n} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ShieldCheck className="h-3 w-3" />
            </span>
            <span className="flex-1 truncate text-[11px] font-medium text-foreground">{r.n}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                r.ok === true
                  ? "bg-success-soft text-success"
                  : r.ok === false
                    ? "bg-warning-soft text-warning"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {r.s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScreenReporte() {
  return (
    <div className="flex h-full flex-col bg-background p-4 font-body">
      <p className="font-display text-sm font-extrabold text-foreground">Reportes</p>
      <div className="mt-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-foreground">Semana 21 – 27 jul</p>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
            <FileDown className="h-3 w-3" /> PDF
          </span>
        </div>
        <p className="tabular mt-1 text-lg font-extrabold text-foreground">$1.240.000</p>
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          {[
            { n: "Carlos Ramírez", v: "$310.500" },
            { n: "Mónica Torres", v: "$298.200" },
          ].map((r) => (
            <div key={r.n} className="text-[10px]">
              <div className="flex justify-between font-medium text-foreground">
                <span>{r.n}</span>
                <span className="tabular">{r.v}</span>
              </div>
              <p className="text-muted-foreground">Ordinarias 42h · Nocturnas 3h</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScreenWhatsapp() {
  return (
    <div className="flex h-full flex-col bg-[#e5ddd5] p-4 font-body">
      <div className="flex items-center gap-2 rounded-lg bg-card/90 p-2 text-[10px] font-semibold text-foreground">
        <MessageCircle className="h-3.5 w-3.5 text-success" /> Contador · TurnoCheck
      </div>
      <div className="mt-4 ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-2.5 text-[11px] text-[#1b1b1b] shadow-sm">
        Aquí está el reporte de la quincena, ya calculado 📎
        <div className="mt-1.5 flex items-center gap-1.5 rounded bg-white/70 p-1.5">
          <FileDown className="h-3 w-3" /> Nomina_quincena_28jul.pdf
        </div>
      </div>
      <div className="mt-2 ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-2 text-[10px] text-[#1b1b1b]">
        Total a pagar: $1.240.000
      </div>
    </div>
  );
}
