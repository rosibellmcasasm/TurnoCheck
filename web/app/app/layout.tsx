import type { ReactNode } from "react";
import { BottomNav } from "@/components/app/shell/BottomNav";
import { AppHeader } from "@/components/app/shell/AppHeader";
import { AppPageTransition } from "@/components/app/shell/AppPageTransition";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader />
      <div className="flex-1 pb-28">
        <AppPageTransition>{children}</AppPageTransition>
      </div>
      <BottomNav />
    </div>
  );
}
