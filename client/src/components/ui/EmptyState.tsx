import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
}

export function EmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-bright">
        <Icon size={20} />
      </span>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint ? <p className="max-w-xs text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
