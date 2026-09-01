"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Settings, MapPin } from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Hoy", icon: Home },
  { href: "/app/empleados", label: "Empleados", icon: Users },
  { href: "/app/mapa", label: "Mapa", icon: MapPin },
  { href: "/app/reportes", label: "Reportes", icon: FileText },
  { href: "/app/ajustes", label: "Ajustes", icon: Settings },
] as const;

/** Menú lateral — solo visible en pantallas anchas (md+). En celular se usa
 *  BottomNav; nunca los dos a la vez. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-card md:flex">
      <Link href="/app" className="flex items-center gap-2 px-6 pt-6 pb-2">
        <Image
          src="/brand/turnocheck-logo-raster.png"
          alt="TurnoCheck"
          width={26}
          height={24}
          className="h-6 w-auto"
        />
        <span className="font-display text-base font-extrabold text-foreground">TurnoCheck</span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
        {ITEMS.map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
