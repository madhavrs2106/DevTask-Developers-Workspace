import { useId, type ReactNode } from "react";
import { useAccentPalette } from "../../lib/accent";

interface ProgressRingProps {
  /** 0-100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  from?: string;
  to?: string;
  trackColor?: string;
  children?: ReactNode;
}

/** Circular progress ring with a neon gradient stroke and soft glow. */
export function ProgressRing({
  percent,
  size = 72,
  strokeWidth = 6,
  from,
  to,
  trackColor = "#1E293B",
  children,
}: ProgressRingProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pal = useAccentPalette();
  const startColor = from ?? pal.accent;
  const endColor = to ?? pal.deep;
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.21,1.02,.73,1)" }}
        />
      </svg>
      {/* glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-full"
        style={{ boxShadow: `0 0 ${size / 4}px ${pal.accent}47` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
