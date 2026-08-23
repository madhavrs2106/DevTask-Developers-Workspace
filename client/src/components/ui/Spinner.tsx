import { cn } from "../../lib/utils";
import { LogoMark } from "./LogoMark";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-accent" />
      {label ? <span className="text-sm text-ink-muted">{label}</span> : null}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-midnight">
      <LogoMark size={46} className="animate-pulse-glow" />
      <Spinner label="Loading DevTask…" />
    </div>
  );
}
