import { useId, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useAccentPalette } from "../../lib/accent";

interface SparklineProps {
  values: number[];
  height?: number;
}

/** Minimal glowing sparkline used inside metric cards. */
export function Sparkline({ values, height = 40 }: SparklineProps) {
  const gradientId = `spark${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pal = useAccentPalette();
  const data = useMemo(() => values.map((v, i) => ({ i, v })), [values]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pal.accent} stopOpacity={0.45} />
              <stop offset="100%" stopColor={pal.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={pal.bright}
            strokeWidth={1.8}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
