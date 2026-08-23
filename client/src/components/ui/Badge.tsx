import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Neutral pill — pass chip classes for colored variants. */
export function Badge({ children, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium leading-none",
        className ?? "border-slate-700 bg-slate-800/60 text-slate-300"
      )}
    >
      {children}
    </span>
  );
}
