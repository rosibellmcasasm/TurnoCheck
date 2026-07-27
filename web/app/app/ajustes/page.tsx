"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { readAppData, writeAppData, type AppData } from "@/lib/app-storage";

export default function AjustesPage() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const d = readAppData();
    setData(d);
    setNombre(d.empresa.nombre);
  }, []);

  function guardar() {
    if (!data) return;
    const next = { ...data, empresa: { ...data.empresa, nombre } };
    writeAppData(next);
    setData(next);
  }

  if (!data) return null;

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
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-snug text-muted-foreground">
          Tus datos y los de tus empleados están guardados en este dispositivo por
          ahora. Cuando actives tu plan, se respaldan de forma segura en la nube.
        </p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-6 flex items-center gap-2 text-sm font-medium text-destructive"
      >
        <LogOut className="h-4 w-4" /> Salir de TurnoCheck
      </button>
    </div>
  );
}
