"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Users, MapPin, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureCompany, type Company } from "@/lib/supabase/queries";

function FilaMenu({
  href,
  icon: Icon,
  titulo,
  subtitulo,
}: {
  href: string;
  icon: typeof Building2;
  titulo: string;
  subtitulo: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{titulo}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitulo}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function AjustesPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCompany(await ensureCompany(supabase, user.id));
      setCargando(false);
    })();
  }, []);

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (cargando || !company) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-7 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-extrabold text-foreground">Ajustes</h1>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Organización
      </p>
      <div className="mt-2">
        <FilaMenu
          href="/app/ajustes/organizacion"
          icon={Building2}
          titulo={company.name}
          subtitulo="Nombre, plan, período de pago, cierre automático"
        />
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Personas
      </p>
      <div className="mt-2">
        <FilaMenu
          href="/app/empleados"
          icon={Users}
          titulo="Empleados"
          subtitulo="Agregar, editar, salarios, horarios"
        />
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Localizaciones
      </p>
      <div className="mt-2">
        <FilaMenu
          href="/app/ajustes/localizaciones"
          icon={MapPin}
          titulo="Sitios de trabajo"
          subtitulo="Geocerca, cliente final, % de avance"
        />
      </div>

      <button
        onClick={salir}
        className="mt-8 flex items-center gap-2 text-sm font-medium text-destructive"
      >
        <LogOut className="h-4 w-4" /> Salir de TurnoCheck
      </button>
    </div>
  );
}
