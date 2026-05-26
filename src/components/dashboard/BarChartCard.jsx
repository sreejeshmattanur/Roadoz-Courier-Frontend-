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
} from "recharts";

const GRADIENT_COLORS = [
  "#ffc107", "#f97316", "#ef4444", "#a855f7",
  "#3b82f6", "#14b8a6", "#22c55e", "#ec4899",
];

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
        <p style={{ color: "#ffc107", fontWeight: 700 }}>{payload[0].value} orders</p>
      </div>
    );
  }
  return null;
};

export function BarChartCard({ title, data, subtitle }) {
  return (
    <Card className="bg-card-bg border-border-subtle h-full transition-colors duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-text-main">{title}</CardTitle>
            {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Live
          </div>
        </div>
        <div className="h-px bg-border-subtle w-full mt-3" />
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }} barSize={32}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,193,7,0.06)" }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
