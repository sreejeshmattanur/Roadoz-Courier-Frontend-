import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  CheckCircle2,
  RotateCcw,
  IndianRupee,
  ShoppingCart,
  Users,
  Store,
  Wallet,
  TrendingUp,
  Package,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { PieChartCard } from "../components/dashboard/PieChartCard";
import { BarChartCard } from "../components/dashboard/BarChartCard";
import { RadialChartCard } from "../components/dashboard/RadialChartCard";
import { fetchAnalyticsDashboard } from "../redux/analyticsSlice";

function objectToChartData(obj = {}) {
  return Object.entries(obj)
    .filter(([name]) => name !== "")
    .map(([name, value]) => ({ name, value: Number(value) }));
}


export function Dashboard() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.analytics);

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  const today = new Date();
  const defaultDate = formatDate(today);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    dispatch(fetchAnalyticsDashboard({ date_from: startDate, date_to: endDate }));
  }, [dispatch, startDate, endDate]);

  // Chart data derivations
  const orderStatusData = objectToChartData(data?.order_statuses);
  const codPrepaidData = objectToChartData(data?.cod_vs_prepaid);
  const deliveredRtoData = objectToChartData(data?.delivered_vs_rto);
  const statewiseData = objectToChartData(data?.statewise_orders);

  const deliveredCount = data?.delivered_vs_rto?.Delivered ?? 0;
  const totalOrders = data?.total_orders ?? 0;
  const deliveryRate =
    totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : 0;

  // Extra counts
  const totalUsers = data?.extra_counts?.total_users ?? 0;
  const totalFranchises = data?.extra_counts?.total_franchises ?? 0;
  const walletBalance = data?.extra_counts?.total_wallet_balance ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Dashboard</h1>
          <p className="text-sm text-primary mt-1 flex items-center gap-1">
            <span className="text-text-muted">Home</span>
            <span className="text-text-muted mx-1">&rsaquo;</span>
            <span>Dashboard</span>
          </p>
        </div>
        <div className="bg-card-bg border border-border-subtle rounded-lg px-4 py-2.5 inline-flex items-center gap-3 text-sm text-text-muted shadow-sm">
          <Calendar size={16} className="text-primary" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="bg-transparent text-sm text-text-main px-1 py-0.5 rounded focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-text-muted">→</span>
            <input
              type="date"
              className="bg-transparent text-sm text-text-main px-1 py-0.5 rounded focus:outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate !== "" || endDate !== "") && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="ml-2 text-primary hover:text-primary-dark focus:outline-none flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Clear date filter"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          {loading && (
            <span className="ml-2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* ── Row 1: Stat Cards (7 cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          description="All orders in period"
          icon={<ShoppingCart size={22} />}
          iconBgColor="bg-blue-500"
          trend={12}
          trendLabel="vs last week"
        />
        <StatCard
          title="Delivered"
          value={deliveredCount}
          description={`${deliveryRate}% delivery rate`}
          icon={<CheckCircle2 size={22} />}
          iconBgColor="bg-green-500"
          trend={8}
          trendLabel="vs last week"
        />
        <StatCard
          title="RTO Orders"
          value={data?.rto_orders ?? 0}
          description="Return to origin"
          icon={<RotateCcw size={22} />}
          iconBgColor="bg-rose-500"
          trend={-2}
          trendLabel="vs last week"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(data?.total_revenue_or_spend ?? 0).toLocaleString("en-IN")}`}
          description="Gross revenue in period"
          icon={<IndianRupee size={22} />}
          iconBgColor="bg-amber-500"
          trend={15}
          trendLabel="vs last week"
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          description="Registered accounts"
          icon={<Users size={22} />}
          iconBgColor="bg-violet-500"
        />
        <StatCard
          title="Franchises"
          value={totalFranchises}
          description="Active franchise partners"
          icon={<Store size={22} />}
          iconBgColor="bg-teal-500"
        />
        <StatCard
          title="Wallet Balance"
          value={`₹${Number(walletBalance).toLocaleString("en-IN")}`}
          description="Total wallet balance"
          icon={<Wallet size={22} />}
          iconBgColor="bg-sky-500"
        />
        <StatCard
          title="Wallet Txns"
          value={data?.wallet_transactions_count ?? 0}
          description="Transactions in period"
          icon={<TrendingUp size={22} />}
          iconBgColor="bg-pink-500"
        />
      </div>


      {/* ── Row 3: Order Statuses Pie + COD vs Prepaid Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartCard
          title="Order Statuses"
          subtitle="Current status breakdown"
          data={
            orderStatusData.length
              ? orderStatusData
              : [
                { name: "Picked", value: 7 },
                { name: "Processing", value: 18 },
                { name: "Delivered", value: 2 },
                { name: "Warehouse", value: 1 },
              ]
          }
          colors={["#3b82f6", "#ffc107", "#22c55e", "#a855f7"]}
        />
        <PieChartCard
          title="COD vs Prepaid"
          subtitle="Payment mode split"
          data={
            codPrepaidData.length
              ? codPrepaidData
              : [
                { name: "Prepaid", value: 28 },
                { name: "COD", value: 2 },
              ]
          }
          isDonut={true}
          colors={["#22c55e", "#f97316"]}
        />
      </div>

      {/* ── Row 4: Bar chart (statewise) + Pie chart (delivered vs rto) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Statewise Orders"
          subtitle="Top states by order volume"
          data={
            statewiseData.length
              ? statewiseData
              : [
                { name: "Kerala", value: 16 },
                { name: "Maharashtra", value: 4 },
                { name: "Karnataka", value: 3 },
                { name: "Telangana", value: 2 },
              ]
          }
        />
        <RadialChartCard
          title="Delivered vs RTO"
          subtitle="Final delivery outcome"
          data={
            deliveredRtoData.length
              ? deliveredRtoData
              : [
                { name: "Delivered", value: 2 },
                { name: "RTO", value: 0 },
              ]
          }
          colors={["#22c55e", "#ef4444"]}
        />
      </div>


    </div>
  );
}
