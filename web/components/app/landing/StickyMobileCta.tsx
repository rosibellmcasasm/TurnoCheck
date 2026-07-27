import { CTA_HREF } from "./config";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
      <a
        href={CTA_HREF}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25"
      >
        Calcular mi primera nómina gratis
      </a>
    </div>
  );
}
