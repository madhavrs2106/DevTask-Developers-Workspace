import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAccentPalette } from "../../lib/accent";

interface WeeklyCodingChartProps {
  data: { day: string; date: string; hours: number }[];
}

const GRADIENT_ID = "weeklyHoursGradient";

export function WeeklyCodingChart({ data }: WeeklyCodingChartProps) {
  const pal = useAccentPalette();
  const max = Math.max(1, ...data.map((d) => d.hours));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pal.bright} />
              <stop offset="100%" stopColor={pal.deep} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1E293B" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#94A3B8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, Math.ceil(max)]}
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: `${pal.accent}0F` }}
            content={<HoursTooltip />}
          />
          <Bar dataKey="hours" radius={[6, 6, 2, 2]} maxBarSize={38}>
            {data.map((entry, i) => (
              <Cell
                key={entry.date}
                fill={`url(#${GRADIENT_ID})`}
                opacity={i === data.length - 1 ? 1 : 0.72}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HoursTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { day: string; date: string; hours: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="card px-3 py-2 text-xs shadow-glow-sm">
      <p className="font-mono font-semibold text-white">
        {point.hours.toFixed(1)}h <span className="font-sans text-ink-faint">coded</span>
      </p>
      <p className="mt-0.5 text-[11px] text-ink-faint">{point.day}</p>
    </div>
  );
}
