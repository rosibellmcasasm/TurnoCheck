"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  ArrowRight,
  X,
  Lock,
  FileText,
  Ban,
} from "lucide-react";
import {
  ONBOARDING_DEFAULT,
  planRecomendado,
  readOnboarding,
  type OnboardingData,
} from "@/lib/onboarding-storage";

const PLANES = {
  micro: { nombre: "Plan Micro", hasta: "hasta 5 empleados", mensual: 9.99, anual: 7.99 },
  pyme: { nombre: "Plan Pyme", hasta: "hasta 15 empleados", mensual: 19.99, anual: 15.99 },
} as const;

// Conversión aproximada solo para referencia visual — el cobro real lo hace Hotmart
// en la moneda y tasa vigentes al momento del pago (nunca un monto prometido aquí).
const USD_A_COP_APROX = 4000;

const BENEFICIOS = [
  { texto: "Prueba anti-demandas: foto y ubicación en cada marcación", icon: ShieldCheck },
  { texto: "Cálculo automático según la ley colombiana: extras, nocturnas y festivos", icon: Check },
  { texto: "Reporte en PDF, listo para tu contador por WhatsApp", icon: FileText },
];

const CONFIANZA = [
  { texto: "Pago seguro procesado por Hotmart", icon: Lock },
  { texto: "Cálculos adaptados a la ley laboral colombiana", icon: ShieldCheck },
  { texto: "Cancela cuando quieras, sin penalidades", icon: Ban },
];

export default function PaywallPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(ONBOARDING_DEFAULT);
  const [anual, setAnual] = useState(true);

  useEffect(() => {
    // Mismo caso que en /onboarding: lectura única de localStorage tras montar,
    // necesaria porque no existe durante el render de servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(readOnboarding());
  }, []);

  const planId = planRecomendado(data.tamanoEquipo);
  const plan = PLANES[planId];
  const precio = anual ? plan.anual : plan.mensual;
  const precioCop = Math.round((precio * USD_A_COP_APROX) / 1000) * 1000;

  const fechaCobro = new Date();
  fechaCobro.setDate(fechaCobro.getDate() + 7);
  const fechaCobroTexto = fechaCobro.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
  const diaRecordatorio = new Date();
  diaRecordatorio.setDate(diaRecordatorio.getDate() + 5);
  const diaRecordatorioTexto = diaRecordatorio.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground">
          Protege tu negocio y liquida tus horas sin errores
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ya viste cómo TurnoCheck calcula un turno real de {data.nombreNegocio || "tu negocio"}.
        </p>

        <ul className="mt-6 space-y-2.5">
          {BENEFICIOS.map((b) => (
            <li key={b.texto} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <b.icon className="h-3 w-3" strokeWidth={2.5} />
              </span>
              {b.texto}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-6 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            onClick={() => setAnual(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !anual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnual(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              anual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Anual · Ahorra 2 meses
          </button>
        </div>

        <div className="relative mt-4 rounded-2xl border-2 border-primary bg-card p-5">
          <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Recomendado para ti
          </span>
          <p className="font-display text-base font-bold text-foreground">{plan.nombre}</p>
          <p className="text-xs text-muted-foreground">{plan.hasta}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="tabular font-display text-3xl font-extrabold text-foreground">
              ${precio.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">USD/mes</span>
          </div>
          <p className="tabular text-xs text-muted-foreground">
            ≈ ${precioCop.toLocaleString("es-CO")} COP/mes (aprox., según tasa del día)
            {anual && ` · Facturado $${(precio * 12).toFixed(2)} USD/año`}
          </p>
        </div>

        {/* Línea de tiempo del trial — responde de frente el miedo a un cobro sorpresa */}
        <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/40 p-4">
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="tabular mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                1
              </span>
              <p className="text-xs text-foreground">
                <span className="font-semibold">Hoy:</span> acceso completo, $0 pesos cobrados.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="tabular mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                2
              </span>
              <p className="text-xs text-foreground">
                <span className="font-semibold">{diaRecordatorioTexto}:</span> te avisamos por
                correo antes de que termine tu prueba.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="tabular mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                3
              </span>
              <p className="text-xs text-foreground">
                <span className="font-semibold">{fechaCobroTexto}:</span> se cobra ${precio.toFixed(2)}{" "}
                USD, solo si no cancelaste antes.
              </p>
            </li>
          </ol>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Si cierras esta pantalla, el cálculo de {data.nombreNegocio || "tu negocio"} queda sin
          guardar — y sigues sin respaldo si algo pasa.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25"
          style={{ height: 52 }}
        >
          Probar 7 días gratis — $0 hoy <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Cancela cuando quieras, sin contratos ni letra chica.
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5">
          {CONFIANZA.map((c) => (
            <div key={c.texto} className="flex items-center gap-2 text-xs text-muted-foreground">
              <c.icon className="h-3.5 w-3.5 shrink-0 text-success" />
              {c.texto}
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/")}
          className="mx-auto mt-5 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Ahora no
        </button>
      </div>
    </div>
  );
}
