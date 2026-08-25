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

interface HoursStudiedChartProps {
  data: { label: string; hours: number }[];
}

const GRADIENT_ID = "hoursGradient";

export function HoursStudiedChart({ data }: HoursStudiedChartProps) {
  const max = Math.max(1, ...data.map((d) => d.hours));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -22 }} barCategoryGap="30%">
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1E293B" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
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
          <Tooltip cursor={{ fill: "rgba(129,140,248,.06)" }} content={<HoursTooltip />} />
          <Bar dataKey="hours" radius={[6, 6, 2, 2]} maxBarSize={30}>
            {data.map((entry, i) => (
              <Cell
                key={entry.label}
                fill={`url(#${GRADIENT_ID})`}
                opacity={i === data.length - 1 ? 1 : 0.65}
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
  payload?: { payload?: { label: string; hours: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="card px-3 py-2 text-xs shadow-glow-sm">
      <p className="font-mono font-semibold text-white">
        {point.hours} <span className="font-sans text-ink-faint">hours studied</span>
      </p>
      <p className="mt-0.5 text-[11px] text-ink-faint">{point.label}</p>
    </div>
  );
}
