import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, CheckCircle2, RotateCcw, IndianRupee } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { PieChartCard } from "../components/dashboard/PieChartCard";
import { fetchAnalyticsDashboard } from "../redux/analyticsSlice";

function objectToChartData(obj = {}) {
  return Object.entries(obj).map(([name, value]) => ({ name, value: Number(value) }));
}

export function Dashboard() {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalyticsDashboard());
  }, [dispatch]);

  // Derive chart data from API; fall back to original static data if empty
  const walletData = objectToChartData(data?.order_statuses).length
    ? objectToChartData(data?.order_statuses)
    : [{ name: "Completed", value: 60 }, { name: "Pending", value: 25 }, { name: "Cancelled", value: 15 }];

  const courierData = objectToChartData(data?.cod_vs_prepaid).length
    ? objectToChartData(data?.cod_vs_prepaid)
    : [{ name: "CourierWa Air", value: 40 }, { name: "SkeCourierWa Surface", value: 60 }];

  const orderStatusData = objectToChartData(data?.delivered_vs_rto).length
    ? objectToChartData(data?.delivered_vs_rto)
    : [{ name: "Completed", value: 60 }, { name: "Pending", value: 25 }, { name: "Cancelled", value: 15 }];

  const courierWiseData = objectToChartData(data?.statewise_orders).length
    ? objectToChartData(data?.statewise_orders)
    : [{ name: "CourierWa Air", value: 40 }, { name: "SkeCourierWa Surface", value: 60 }];

  // Each array uses colors from distinct hue families only
  const walletColors      = ["#ef4444", "#3b82f6", "#22c55e"];           // Red, Blue, Green
  const codPrepaidColors  = ["#f97316", "#a855f7", "#14b8a6", "#ec4899"]; // Orange, Purple, Teal, Pink
  const orderStatusColors = ["#eab308", "#ef4444", "#3b82f6", "#22c55e"]; // Yellow, Red, Blue, Green
  const courierColors     = ["#14b8a6", "#a855f7", "#f97316", "#ec4899"]; // Teal, Purple, Orange, Pink

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-main">Dashboard</h1>
        <p className="text-sm text-primary mt-1">
          Dashboard <span className="text-text-muted mx-1">&gt;&gt;</span> Dashboard
        </p>  
      </div>

      <div className="bg-card-bg border border-border-subtle rounded-lg p-3 inline-flex items-center gap-3 text-sm text-text-muted transition-colors duration-300">
        <Calendar size={18} className="text-text-muted" />
        <span>2026-03-07 to 2026-03-13</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={data?.total_orders ?? "4"}
          description="From 2026-03- to 2026-03-13"
          icon={<Calendar size={24} />}
          iconBgColor="bg-blue-500/80"
        />
        <StatCard
          title="Delivered Orders"
          value={data?.delivered_vs_rto?.delivered ?? "0"}
          description="With selected period"
          icon={<CheckCircle2 size={24} />}
          iconBgColor="bg-green-500/80"
        />
        <StatCard
          title="RTO Orders"
          value={data?.rto_orders ?? "0"}
          description="in selected date range"
          icon={<RotateCcw size={24} />}
          iconBgColor="bg-sky-500/80"
        />
        <StatCard
          title="Total Revenue"
          value={data?.total_revenue_or_spend ?? "0"}
          description="From 2026-03- to 2026-03-13"
          icon={<IndianRupee size={24} />}
          iconBgColor="bg-red-500/80"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PieChartCard
          title="Wallet Transaction"
          data={walletData}
          colors={walletColors}
        />
        <PieChartCard
          title="COD Vs Prepaidn"
          data={courierData}
          colors={codPrepaidColors}
          isDonut={true}
          centerLabel="229.46"
        />
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PieChartCard
          title="Order Statuses"
          data={orderStatusData}
          colors={orderStatusColors}
        />
        <PieChartCard
          title="Courier Wise Load"
          data={courierWiseData}
          colors={courierColors}
          isDonut={true}
          centerLabel="229.46"
        />
      </div>
    </div>
  );
}
