import { CalendarDays } from "lucide-react";
import { proximosFestivos } from "@/lib/festivos-colombia";

export function ProximosFestivos() {
  const festivos = proximosFestivos(new Date(), 2);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Próximos festivos
        </h2>
      </div>
      {festivos.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No hay festivos próximos.</p>
      ) : (
        <div className="mt-2.5 space-y-2">
          {festivos.map((f) => (
            <div key={f.nombre} className="flex items-center justify-between text-sm">
              <span className="min-w-0 truncate font-medium text-foreground">{f.nombre}</span>
              <span className="tabular shrink-0 text-xs text-muted-foreground">
                {f.fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "UTC" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
