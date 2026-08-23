import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Sparkline } from "./Sparkline";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: ReactNode;
  /** Optional trailing sparkline series */
  spark?: number[];
}

export function StatCard({ label, value, icon: Icon, sub, spark }: StatCardProps) {
  return (
    <article className="card card-interactive group relative overflow-hidden p-5">
      {/* corner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl transition-opacity duration-300 group-hover:bg-accent/20"
      />

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent-bright transition-all duration-300 group-hover:shadow-glow-sm">
          <Icon size={16} />
        </span>
      </div>

      <p className="metric-mono mt-3 text-[28px] font-bold leading-none text-white">{value}</p>

      {sub ? <div className={cn("mt-2 text-xs", "text-ink-faint")}>{sub}</div> : null}

      {spark && spark.length > 1 ? (
        <div className="mt-3 opacity-80 transition-opacity group-hover:opacity-100">
          <Sparkline values={spark} />
        </div>
      ) : null}
    </article>
  );
}
