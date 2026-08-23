import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useId } from "react";
import { useAccentPalette } from "../../lib/accent";

interface CompletionDonutProps {
  /** 0-100 */
  rate: number;
  done: number;
  total: number;
}

export function CompletionDonut({ rate, done, total }: CompletionDonutProps) {
  const gradientId = `donut${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pal = useAccentPalette();
  const clamped = Math.max(0, Math.min(100, rate));

  const data = [
    { name: "Completed", value: clamped },
    { name: "Remaining", value: 100 - clamped },
  ];

  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={pal.accent} />
              <stop offset="100%" stopColor={pal.deep} />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="72%"
            outerRadius="92%"
            startAngle={90}
            endAngle={90 - 360}
            paddingAngle={clamped === 0 || clamped === 100 ? 0 : 2}
            cornerRadius={8}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={`url(#${gradientId})`} />
            <Cell fill="#1E293B" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="metric-mono glow-text text-3xl font-bold text-white">{clamped}%</span>
        <span className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">completion</span>
        <span className="metric-mono mt-2 text-[11px] text-accent-bright/80">
          {done}/{total} tasks
        </span>
      </div>
    </div>
  );
}
