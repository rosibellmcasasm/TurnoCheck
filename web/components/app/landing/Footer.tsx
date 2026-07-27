import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} TurnoCheck. Todos los derechos reservados.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/privacidad" className="hover:text-foreground">
            Política de Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-foreground">
            Términos y Condiciones
          </Link>
          <Link href="/reembolso" className="hover:text-foreground">
            Política de Reembolso
          </Link>
          <Link href="/contacto" className="hover:text-foreground">
            Contacto
          </Link>
        </nav>
      </div>
    </footer>
  );
}
