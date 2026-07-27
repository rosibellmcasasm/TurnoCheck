"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    // TODO Sesión 6: reemplazar por supabase.auth.signInWithOtp({ email }) real.
    setSent(true);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image src="/brand/turnocheck-logo-raster.png" alt="TurnoCheck" width={56} height={52} className="h-14 w-auto" />
          <h1 className="mt-4 font-display text-xl font-extrabold text-foreground">
            {sent ? "Revisa tu correo" : "Entra a TurnoCheck"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {sent
              ? `Te enviamos un link mágico a ${email}. Ábrelo desde tu celular para activar tu cuenta.`
              : "Sin contraseñas. Te enviamos un link a tu correo para entrar."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="mt-7">
            <label className="block text-sm font-medium text-foreground">
              Correo electrónico
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@negocio.com"
                  className="h-12 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-[15px] text-foreground outline-none focus:border-primary"
                />
              </div>
            </label>
            <button
              type="submit"
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground"
            >
              Enviarme el link <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="mt-7 rounded-xl border border-dashed border-border bg-secondary/50 p-4 text-center text-sm text-muted-foreground">
            ¿No te llegó? Revisa spam o{" "}
            <button onClick={() => setSent(false)} className="font-medium text-primary underline">
              intenta con otro correo
            </button>
            .
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al continuar aceptas los{" "}
          <Link href="/terminos" className="underline hover:text-foreground">
            Términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline hover:text-foreground">
            Política de Privacidad
          </Link>
          .
        </p>

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a TurnoCheck
        </Link>
      </div>
    </div>
  );
}
