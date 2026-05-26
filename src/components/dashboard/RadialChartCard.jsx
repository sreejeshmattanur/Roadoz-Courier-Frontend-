import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "10px 16px",
          color: "var(--text-main)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ color: payload[0].fill, fontWeight: 700 }}>
          {payload[0].value} orders
        </p>
      </div>
    );
  }
  return null;
};

export function RadialChartCard({ title, subtitle, data, colors = [] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  const enriched = data.map((d, i) => ({
    ...d,
    fill: colors[i] ?? "#ffc107",
    pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0",
  }));

  return (
    <Card className="bg-card-bg border-border-subtle h-full transition-colors duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-text-main">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-text-muted mt-1">{subtitle}</p>
            )}
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {total} total
          </div>
        </div>
        <div className="h-px bg-border-subtle w-full mt-3" />
      </CardHeader>

      <CardContent className="pt-4 flex flex-col justify-center" style={{ minHeight: 260 }}>
        {/* Big stat numbers */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {enriched.map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-4 text-center"
              style={{
                background: `linear-gradient(135deg, ${item.fill}20 0%, ${item.fill}08 100%)`,
                border: `1px solid ${item.fill}30`,
              }}
            >
              <p className="text-3xl font-bold tabular-nums" style={{ color: item.fill }}>
                {item.value}
              </p>
              <p className="text-xs text-text-muted mt-1 font-medium">{item.name}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: item.fill }}>
                {item.pct}%
              </p>
            </div>
          ))}
        </div>

        {/* Horizontal bar chart */}
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            layout="vertical"
            data={enriched}
            margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
            barSize={28}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
            />
            <XAxis
              type="number"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {enriched.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{ fill: "var(--text-main)", fontSize: 13, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
