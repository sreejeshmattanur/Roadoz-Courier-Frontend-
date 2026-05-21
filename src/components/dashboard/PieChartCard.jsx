import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// 8 colors from completely different hue families — no two are similar shades
const UNIQUE_POOL = [
  "#ef4444", // Red       0°
  "#f97316", // Orange   25°
  "#eab308", // Yellow   50°
  "#22c55e", // Green   142°
  "#14b8a6", // Teal    174°
  "#3b82f6", // Blue    217°
  "#a855f7", // Purple  270°
  "#ec4899", // Pink    328°
];

function resolveColors(colors, count) {
  // Merge caller colors + pool extras, deduplicated, up to count
  const merged = [...colors];
  for (const c of UNIQUE_POOL) {
    if (merged.length >= count) break;
    if (!merged.includes(c)) merged.push(c);
  }
  return merged;
}

export function PieChartCard({ title, data, colors, isDonut = false, centerLabel }) {
  const resolved = resolveColors(colors, data.length);

  return (
    <Card className="bg-card-bg border-border-subtle h-full transition-colors duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-main">{title}</CardTitle>
        <div className="h-px bg-border-subtle w-full mt-2"></div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center min-h-[300px] relative">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? 60 : 0}
              outerRadius={100}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={resolved[index]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)' }}
              itemStyle={{ color: 'var(--text-main)' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {isDonut && centerLabel && (
          <p className="text-2xl font-bold text-text-main mt-2">{centerLabel}</p>
        )}

        <div className="mt-4 flex flex-col gap-2 w-full">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-text-muted">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resolved[index] }}></div>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

