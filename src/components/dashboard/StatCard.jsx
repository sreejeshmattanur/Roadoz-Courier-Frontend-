import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";
import { TrendingUp } from "lucide-react";

export function StatCard({ title, value, description, icon, iconBgColor, trend, trendLabel }) {
  const isPositive = trend >= 0;

  return (
    <Card className="bg-card-bg border-border-subtle transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group overflow-hidden relative">
      {/* Subtle glow background */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "pointer-events-none"
        )}
        style={{
          background: "radial-gradient(ellipse at top right, rgba(255,193,7,0.06) 0%, transparent 70%)",
        }}
      />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
              {title}
            </p>
            <h3
              className="text-lg sm:text-xl lg:text-2xl font-bold text-text-main mb-2 tabular-nums truncate whitespace-nowrap"
              title={value}
            >
              {value}
            </h3>
            <p className="text-xs text-text-muted/70 leading-relaxed truncate">
              {description}
            </p>
            {trend !== undefined && (
              <div
                className={cn(
                  "mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                  isPositive
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                <TrendingUp
                  size={11}
                  className={cn(!isPositive && "rotate-180")}
                />
                {isPositive ? "+" : ""}
                {trend}% {trendLabel}
              </div>
            )}
          </div>
          <div
            className={cn(
              "p-3.5 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-4",
              iconBgColor
            )}
          >
            <div className="text-white">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
