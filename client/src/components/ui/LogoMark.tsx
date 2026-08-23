import { cn } from "../../lib/utils";

interface LogoMarkProps {
  /** Tile edge length in px */
  size?: number;
  className?: string;
}

/**
 * DevTask brand mark — a neon-gradient squircle tile with a bold "DT" monogram,
 * glass sheen highlight and a soft cyan glow.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <span
      role="img"
      aria-label="DevTask logo"
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-[30%] bg-neon-gradient",
        className
      )}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 ${Math.round(size * 0.55)}px rgb(var(--accent-rgb) / .42), inset 0 1px 0 rgba(255,255,255,.28)`,
      }}
    >
      {/* Glass sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-slate-950/15"
      />
      {/* Monogram */}
      <span
        className="relative font-sans font-extrabold leading-none text-slate-950"
        style={{
          fontSize: Math.round(size * 0.34),
          letterSpacing: "-0.03em",
          transform: "translateY(-1%)",
        }}
      >
        DT
      </span>
    </span>
  );
}
