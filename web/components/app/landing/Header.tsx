import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-foreground">
          <Image src="/brand/turnocheck-logo-raster.png" alt="TurnoCheck" width={32} height={30} className="h-8 w-auto" />
          TurnoCheck
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
