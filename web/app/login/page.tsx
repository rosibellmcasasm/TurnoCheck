"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, AlertTriangle, KeyRound } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ensureCompany } from "@/lib/supabase/queries";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Algunos correos (Hotmail/Outlook sobre todo) "abren" el link mágico ellos
  // solos apenas llega (escaneo de seguridad "Safe Links"), gastando el link
  // antes de que el usuario le haga clic — por eso ofrecemos también el
  // código de 6 dígitos que llega en el mismo correo, que nadie puede
  // "pre-consumir" porque hay que escribirlo a mano.
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setEnviando(false);
    if (error) {
      setError("No pudimos enviar el link. Revisa tu correo e intenta de nuevo.");
      return;
    }
    setSent(true);
  }

  async function handleVerificarCodigo(e: FormEvent) {
    e.preventDefault();
    if (codigo.trim().length < 6) return;
    setVerificando(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: codigo.trim(),
      type: "email",
    });
    if (error || !data.user) {
      setVerificando(false);
      setError("Ese código no es válido o ya venció. Pide uno nuevo.");
      return;
    }
    try {
      await ensureCompany(supabase, data.user.id);
    } catch {
      setVerificando(false);
      setError("Tu cuenta quedó activa, pero no pudimos guardar tu negocio. Intenta de nuevo.");
      return;
    }
    router.replace(next);
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
              ? `Te enviamos un correo a ${email} con un link y un código de 6 dígitos.`
              : "Sin contraseñas. Te enviamos un link a tu correo para entrar."}
          </p>
        </div>

        {sent && (
          <form onSubmit={handleVerificarCodigo} className="mt-7">
            <label className="block text-sm font-medium text-foreground">
              Código de 6 dígitos del correo
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="h-12 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-center text-lg font-semibold tracking-[0.3em] text-foreground outline-none focus:border-primary"
                />
              </div>
            </label>
            <p className="mt-2 text-xs text-muted-foreground">
              Si le hiciste clic al link y no funcionó (pasa seguido con Hotmail/Outlook, que
              revisa los links solo antes de que lo abras), usa mejor este código — es del mismo
              correo, más abajo del link.
            </p>
            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <button
              type="submit"
              disabled={verificando || codigo.trim().length < 6}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {verificando ? "Verificando..." : "Entrar con el código"}
              {!verificando && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

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
            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviarme el link"}
              {!enviando && <ArrowRight className="h-4 w-4" />}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
