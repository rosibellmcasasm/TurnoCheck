import type { ReactNode } from "react";

export function PhoneMock({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[260px] shrink-0 sm:w-[290px]">
      <div className="rounded-[2.2rem] border-[6px] border-foreground/90 bg-card shadow-2xl shadow-primary/10">
        <div className="h-[500px] overflow-hidden rounded-[1.7rem] sm:h-[560px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PhonePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted-foreground">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 15l-5-4-9 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-muted-foreground">
        Pantalla en construcción:
        <br />
        <span className="font-semibold text-foreground">{label}</span>
      </p>
    </div>
  );
}
