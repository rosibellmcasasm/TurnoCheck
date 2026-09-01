"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  updateCompanyName,
  updateCompanyPeriodoPago,
  updateCompanyHoraCierre,
  type Company,
  type PeriodoPago,
} from "@/lib/supabase/queries";

const PERIODOS: { valor: PeriodoPago; etiqueta: string }[] = [
  { valor: "semanal", etiqueta: "Semanal" },
  { valor: "quincenal", etiqueta: "Quincenal" },
  { valor: "mensual", etiqueta: "Mensual" },
];

export default function OrganizacionPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      setCompany(empresa);
      setNombre(empresa.name);
      setCargando(false);
    })();
  }, []);

  async function guardarNombre() {
    if (!company) return;
    const supabase = createClient();
    await updateCompanyName(supabase, company.id, nombre);
  }

  async function cambiarPeriodoPago(periodo: PeriodoPago) {
    if (!company) return;
    setCompany({ ...company, periodo_pago: periodo });
    const supabase = createClient();
    await updateCompanyPeriodoPago(supabase, company.id, periodo);
  }

  async function cambiarHoraCierre(hora: string) {
    if (!company) return;
    const horaCierre = hora === "" ? null : hora;
    setCompany({ ...company, hora_cierre_automatico: horaCierre });
    const supabase = createClient();
    await updateCompanyHoraCierre(supabase, company.id, horaCierre);
  }

  if (cargando || !company) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-7 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/app/ajustes")} aria-label="Volver a Ajustes">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="font-display text-xl font-extrabold text-foreground">Organización</h1>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="block text-sm font-medium text-foreground">
          Nombre del negocio
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={guardarNombre}
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
          />
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          Plan actual: <span className="font-medium text-foreground">{company.plan === "pyme" ? "Pyme" : "Micro"}</span>{" "}
          · hasta {company.plan_empleados_limite} empleados
        </p>

        <div className="mt-4 border-t border-border pt-3.5">
          <p className="text-sm font-medium text-foreground">¿Cada cuánto pagas?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Reportes va a agrupar los totales según esto. Las horas extra se siguen calculando
            semana a semana, como lo pide la ley.
          </p>
          <div className="mt-2.5 flex gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => cambiarPeriodoPago(p.valor)}
                className={`h-9 flex-1 rounded-lg text-xs font-semibold ${
                  company.periodo_pago === p.valor
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-sm font-bold text-foreground">Salida automática</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Si un empleado se olvida de marcar su salida, la app cierra sola ese turno a la
          hora que elijas aquí (nunca el turno de hoy — solo los que quedaron abiertos de
          días anteriores). Déjalo vacío para desactivarlo.
        </p>
        <input
          type="time"
          value={company.hora_cierre_automatico ?? ""}
          onChange={(e) => cambiarHoraCierre(e.target.value)}
          className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-snug text-muted-foreground">
          Tus datos y los de tus empleados se guardan de forma segura en la nube,
          protegidos con seguridad a nivel de fila (solo tú puedes verlos).
        </p>
      </div>
    </div>
  );
}
