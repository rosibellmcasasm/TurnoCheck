import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/shell/Sidebar";
import { BottomNav } from "@/components/app/shell/BottomNav";
import { AppHeader } from "@/components/app/shell/AppHeader";
import { AppPageTransition } from "@/components/app/shell/AppPageTransition";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-h-dvh flex-col md:pl-60">
        <div className="md:hidden">
          <AppHeader />
        </div>
        <div className="flex-1 pb-28 md:pb-12">
          <div className="md:mx-auto md:w-full md:max-w-3xl">
            <AppPageTransition>{children}</AppPageTransition>
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
