import Image from "next/image";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex items-center gap-2 px-5 pt-5">
      <Link href="/app" className="flex items-center gap-2">
        <Image
          src="/brand/turnocheck-logo-raster.png"
          alt="TurnoCheck"
          width={24}
          height={22}
          className="h-6 w-auto"
        />
        <span className="font-display text-sm font-extrabold text-foreground">TurnoCheck</span>
      </Link>
    </header>
  );
}
