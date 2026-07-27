import type { ReactNode } from "react";
import { BottomNav } from "@/components/app/shell/BottomNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex-1 pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
