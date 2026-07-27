import { ShieldCheck, Users, Clock, TrendingUp, Sparkles } from "lucide-react";
import { getResumenAdmin, type EmpresaAdmin } from "@/lib/supabase/admin-queries";
import { AnimatedNumber } from "@/components/app/shell/AnimatedNumber";

const ESTADO_LABEL: Record<EmpresaAdmin["estadoSuscripcion"], string> = {
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago fallido",
  canceled: "Cancelada",
};

const ESTADO_CLASE: Record<EmpresaAdmin["estadoSuscripcion"], string> = {
  trialing: "bg-warning-soft text-warning",
  active: "bg-success-soft text-success",
  past_due: "bg-destructive/10 text-destructive",
  canceled: "bg-destructive/10 text-destructive",
};

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage() {
  const resumen = await getResumenAdmin();

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="font-display text-xl font-extrabold text-foreground">Panel de administración</h1>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Solo tú puedes ver esta página — es el resumen de tu negocio en un solo lugar.
      </p>

      {/* Banner de aviso: por ahora no hay disparadores reales (sin ventas/errores
          medidos todavía), así que muestra el estado neutro — cuando haya webhooks
          de Hotmart y error_log, este banner empieza a avisar de verdad. */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-success-soft p-3.5 text-success">
        <Sparkles className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">Todo en orden — sin avisos pendientes.</p>
      </div>

      {/* Resumen de usuarios */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Empresas totales</span>
          </div>
          <AnimatedNumber
            value={resumen.totalEmpresas}
            className="tabular mt-1 block text-2xl font-extrabold text-foreground"
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">En prueba (trial)</span>
          </div>
          <AnimatedNumber
            value={resumen.enTrial}
            className="tabular mt-1 block text-2xl font-extrabold text-foreground"
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Suscripciones activas</span>
          </div>
          <AnimatedNumber
            value={resumen.activas}
            className="tabular mt-1 block text-2xl font-extrabold text-foreground"
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Altas últimos 7 días</span>
          </div>
          <AnimatedNumber
            value={resumen.altasUltimos7Dias}
            className="tabular mt-1 block text-2xl font-extrabold text-foreground"
          />
        </div>
      </div>

      {/* Ventas — honesto: sin Hotmart conectado no hay ingresos reales que mostrar */}
      <h2 className="mt-8 font-display text-sm font-bold text-foreground">Ventas</h2>
      <div className="mt-2 rounded-xl border border-dashed border-border bg-secondary/40 p-4">
        <p className="tabular text-2xl font-extrabold text-muted-foreground">$0</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ingresos de este mes — no medido todavía. Esta card se llena sola en cuanto conectes
          el webhook de Hotmart (pendiente en tu lista de tareas de ESTADO.md).
        </p>
      </div>

      {/* Usuarios */}
      <h2 className="mt-8 font-display text-sm font-bold text-foreground">Usuarios</h2>
      {resumen.empresas.length === 0 ? (
        <div className="mt-2 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">Todavía no hay empresas registradas.</p>
        </div>
      ) : (
        <div className="mt-2 -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 pr-3 font-medium">Correo</th>
                <th className="py-2 pr-3 font-medium">Plan</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 pr-3 font-medium">Empleados</th>
                <th className="py-2 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody>
              {resumen.empresas.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{e.nombre}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{e.email ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-foreground">{e.plan === "pyme" ? "Pyme" : "Micro"}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_CLASE[e.estadoSuscripcion]}`}>
                      {ESTADO_LABEL[e.estadoSuscripcion]}
                    </span>
                  </td>
                  <td className="tabular py-2.5 pr-3 text-foreground">{e.empleadosActivos}</td>
                  <td className="py-2.5 text-muted-foreground">{formatearFecha(e.creadaEl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
