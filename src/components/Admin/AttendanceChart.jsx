import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <div className="rounded-xl border bg-white px-3 py-2 shadow-md border-border">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-1 text-sm" style={{ color: item.color }}>
          {item.name}: <span className="font-semibold">{item.value}</span>
        </p>
      ))}
      <p className="mt-2 border-t pt-1 text-sm font-semibold text-text border-border">
        Total: {total}
      </p>
    </div>
  );
}

export default function AttendanceChart({ chartData, weeklyInsights }) {
  return (
    <div className="card p-5 md:p-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-text">
          Weekly Attendance Dynamics
        </h2>
        <div className="text-left sm:text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
            curved weekly distribution + total trend
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Avg {weeklyInsights.averageTotal} | Peak {weeklyInsights.peakDay} ({weeklyInsights.peakTotal}) | Low {weeklyInsights.lowDay} ({weeklyInsights.lowTotal})
          </p>
        </div>
      </div>
      <div className="h-64 sm:h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="lateFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="earlyLeaveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="leaveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#e5eaf1" />
            <XAxis dataKey="day" tick={{ fill: "#5b687a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#5b687a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<WeeklyTooltip />} />
            <ReferenceLine
              y={weeklyInsights.averageTotal}
              stroke="#334155"
              strokeDasharray="6 4"
              label={{
                value: `Avg ${weeklyInsights.averageTotal}`,
                position: "right",
                fill: "#64748b",
                fontSize: 11,
              }}
            />
            <Legend />
            <Area
              type="natural"
              dataKey="Present"
              stackId="attendance"
              stroke="#16a34a"
              fill="url(#presentFill)"
              strokeWidth={2}
            />
            <Area
              type="natural"
              dataKey="Late"
              stackId="attendance"
              stroke="#d97706"
              fill="url(#lateFill)"
              strokeWidth={2}
            />
            <Area
              type="natural"
              dataKey="EarlyLeave"
              stackId="attendance"
              stroke="#ea580c"
              fill="url(#earlyLeaveFill)"
              strokeWidth={2}
            />
            <Area
              type="natural"
              dataKey="Leave"
              stackId="attendance"
              stroke="#dc2626"
              fill="url(#leaveFill)"
              strokeWidth={2}
            />
            <Line
              type="natural"
              dataKey="Total"
              stroke="#0f172a"
              strokeWidth={3}
              dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
