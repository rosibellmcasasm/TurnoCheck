"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, Users, FileText, Settings, MapPin } from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Hoy", icon: Home },
  { href: "/app/empleados", label: "Empleados", icon: Users },
  { href: "/app/mapa", label: "Mapa", icon: MapPin },
  { href: "/app/reportes", label: "Reportes", icon: FileText },
  { href: "/app/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4 md:hidden">
      <div className="flex items-center gap-1 rounded-full bg-foreground p-1.5 shadow-lg shadow-foreground/25">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="relative flex h-12 w-12 items-center justify-center rounded-full"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <item.icon
                className={`relative z-10 h-5 w-5 transition-colors ${
                  active ? "text-primary-foreground" : "text-background/70"
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
