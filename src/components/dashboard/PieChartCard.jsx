import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// 8 colors from completely different hue families — no two are similar shades
const UNIQUE_POOL = [
  "#ffc107", // Amber/Primary
  "#f97316", // Orange
  "#ef4444", // Red
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ec4899", // Pink
];

function resolveColors(colors = [], count) {
  const merged = [...colors];
  for (const c of UNIQUE_POOL) {
    if (merged.length >= count) break;
    if (!merged.includes(c)) merged.push(c);
  }
  return merged;
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
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
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</p>
        <p style={{ color: item.payload.fill, fontWeight: 700 }}>
          {item.value} ({item.payload.percent !== undefined ? (item.payload.percent * 100).toFixed(1) : ""}%)
        </p>
      </div>
    );
  }
  return null;
};

export function PieChartCard({ title, data, colors, isDonut = false, centerLabel, subtitle }) {
  const resolved = resolveColors(colors, data.length);
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const dataWithPercent = data.map((d) => ({
    ...d,
    percent: total > 0 ? d.value / total : 0,
  }));

  return (
    <Card className="bg-card-bg border-border-subtle h-full transition-colors duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-text-main">{title}</CardTitle>
            {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {total} total
          </div>
        </div>
        <div className="h-px bg-border-subtle w-full mt-3" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col items-center">
          <div className="relative w-full" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithPercent}
                  cx="50%"
                  cy="50%"
                  innerRadius={isDonut ? 55 : 0}
                  outerRadius={90}
                  paddingAngle={isDonut ? 3 : 1}
                  dataKey="value"
                  stroke="none"
                >
                  {dataWithPercent.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={resolved[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut center label */}
            {isDonut && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <p className="text-xl font-bold text-text-main leading-tight">
                  {centerLabel ?? total}
                </p>
                <p className="text-xs text-text-muted">Total</p>
              </div>
            )}
          </div>

          {/* Legend grid */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 w-full px-2">
            {dataWithPercent.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: resolved[index] }}
                />
                <span className="text-xs text-text-muted truncate flex-1">{item.name || "Unknown"}</span>
                <span className="text-xs font-semibold text-text-main ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
