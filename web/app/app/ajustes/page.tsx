"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureCompany, updateCompanyName, type Company } from "@/lib/supabase/queries";

export default function AjustesPage() {
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

  async function guardar() {
    if (!company) return;
    const supabase = createClient();
    await updateCompanyName(supabase, company.id, nombre);
  }

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
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
      <h1 className="font-display text-xl font-extrabold text-foreground">Ajustes</h1>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <label className="block text-sm font-medium text-foreground">
          Nombre del negocio
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={guardar}
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
          />
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          Plan actual: <span className="font-medium text-foreground">{company.plan === "pyme" ? "Pyme" : "Micro"}</span>{" "}
          · hasta {company.plan_empleados_limite} empleados
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-snug text-muted-foreground">
          Tus datos y los de tus empleados se guardan de forma segura en la nube,
          protegidos con seguridad a nivel de fila (solo tú puedes verlos).
        </p>
      </div>

      <button
        onClick={salir}
        className="mt-6 flex items-center gap-2 text-sm font-medium text-destructive"
      >
        <LogOut className="h-4 w-4" /> Salir de TurnoCheck
      </button>
    </div>
  );
}
