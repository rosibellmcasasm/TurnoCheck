import type { LucideIcon } from "lucide-react";

export function ChipOption({
  label,
  sublabel,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {Icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-foreground">{label}</span>
        {sublabel && <span className="block text-xs text-muted-foreground">{sublabel}</span>}
      </span>
    </button>
  );
}
