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
  RefreshCw,
  Truck,
  Zap,
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

  const totalUsers = data?.extra_counts?.total_users ?? 0;
  const totalFranchises = data?.extra_counts?.total_franchises ?? 0;
  const walletBalance = data?.extra_counts?.total_wallet_balance ?? 0;

  const surfaceRates = data?.datafreight_rates?.Surface || [];
  const expressRates = data?.datafreight_rates?.Express || [];

  return (
    <div className="space-y-8 pb-10 px-4 sm:px-6 lg:px-8 bg-background-main min-h-screen transition-colors duration-300">
      
      {/* ── Header & Filters ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pt-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Dashboard</h1>
          <p className="text-sm mt-1 flex items-center gap-1">
            <span className="text-text-muted">Home</span>
            <span className="text-text-muted/50 mx-1">/</span>
            <span className="text-primary font-medium">Analytics Overview</span>
          </p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="bg-card-bg border border-border-subtle rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background-subtle rounded-lg border border-border-subtle">
            <Calendar size={16} className="text-primary" />
            <input
              type="date"
              className="bg-transparent text-sm text-text-main focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <span className="text-text-muted font-bold">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background-subtle rounded-lg border border-border-subtle">
            <input
              type="date"
              className="bg-transparent text-sm text-text-main focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 ml-auto lg:ml-2">
            {(startDate !== "" || endDate !== "") && (
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="text-text-muted hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Clear filter"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            )}
            {loading && !startDate && (
               <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />
            )}
          </div>
        </div>
      </div>


      {/* ── Row 1: Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          description="All orders in period"
          icon={<ShoppingCart size={22} className="text-white" />}
          iconBgColor="bg-blue-600 shadow-blue-500/20"
        />
        <StatCard
          title="Delivered"
          value={deliveredCount}
          description={`${deliveryRate}% delivery rate`}
          icon={<CheckCircle2 size={22} className="text-white" />}
          iconBgColor="bg-emerald-600 shadow-emerald-500/20"
        />
        <StatCard
          title="RTO Orders"
          value={data?.rto_orders ?? 0}
          description="Return to origin"
          icon={<RotateCcw size={22} className="text-white" />}
          iconBgColor="bg-rose-600 shadow-rose-500/20"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(data?.total_revenue_or_spend ?? 0).toLocaleString("en-IN")}`}
          description="Gross revenue"
          icon={<IndianRupee size={22} className="text-white" />}
          iconBgColor="bg-amber-500 shadow-amber-500/20"
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          description="Registered accounts"
          icon={<Users size={22} className="text-white" />}
          iconBgColor="bg-violet-600 shadow-violet-500/20"
        />
        <StatCard
          title="Franchises"
          value={totalFranchises}
          description="Active partners"
          icon={<Store size={22} className="text-white" />}
          iconBgColor="bg-teal-600 shadow-teal-500/20"
        />
        <StatCard
          title="Wallet Balance"
          value={`₹${Number(walletBalance).toLocaleString("en-IN")}`}
          description="System-wide balance"
          icon={<Wallet size={22} className="text-white" />}
          iconBgColor="bg-sky-600 shadow-sky-500/20"
        />
        <StatCard
          title="Wallet Txns"
          value={data?.wallet_transactions_count ?? 0}
          description="Transactions count"
          icon={<TrendingUp size={22} className="text-white" />}
          iconBgColor="bg-pink-600 shadow-pink-500/20"
        />
      </div>

<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Surface Rates Table */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl shadow-sm overflow-hidden transition-all">
            <div className="p-5 border-b border-border-subtle bg-background-subtle/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                   <Truck size={20} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-text-main">Surface Service</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md font-bold">Standard</span>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted bg-background-subtle/30 border-b border-border-subtle">
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Zone</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Weight (Up to)</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Base Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {surfaceRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-background-subtle/50 transition-colors group">
                      <td className="px-6 py-4 text-text-main font-medium">{rate.zone}</td>
                      <td className="px-6 py-4 text-text-muted">{rate.weight_up_to} kg</td>
                      <td className="px-6 py-4 text-right font-bold text-primary group-hover:scale-105 transition-transform">₹{rate.base_rate.toLocaleString()}</td>
                    </tr>
                  ))}
                  {surfaceRates.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-text-muted italic">No Surface rates found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Express Rates Table */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl shadow-sm overflow-hidden transition-all">
            <div className="p-5 border-b border-border-subtle bg-background-subtle/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                   <Zap size={20} className="text-orange-500" />
                </div>
                <h3 className="font-bold text-text-main">Express Service</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md font-bold">Priority</span>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted bg-background-subtle/30 border-b border-border-subtle">
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Zone</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Weight (Up to)</th>
                    <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Base Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {expressRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-background-subtle/50 transition-colors group">
                      <td className="px-6 py-4 text-text-main font-medium">{rate.zone}</td>
                      <td className="px-6 py-4 text-text-muted">{rate.weight_up_to} kg</td>
                      <td className="px-6 py-4 text-right font-bold text-primary group-hover:scale-105 transition-transform">₹{rate.base_rate.toLocaleString()}</td>
                    </tr>
                  ))}
                  {expressRates.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-text-muted italic">No Express rates found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartCard
          title="Order Statuses"
          subtitle="Current status breakdown"
          data={orderStatusData}
          colors={["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6366f1"]}
        />
        <PieChartCard
          title="COD vs Prepaid"
          subtitle="Payment mode split"
          data={codPrepaidData}
          isDonut={true}
          colors={["#10b981", "#f97316", "#3b82f6", "#8b5cf6"]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Statewise Orders"
          subtitle="Top states by order volume"
          data={statewiseData}
        />
        <RadialChartCard
          title="Delivered vs RTO"
          subtitle="Final delivery outcome"
          data={deliveredRtoData}
          colors={["#10b981", "#ef4444"]}
        />
      </div>

      {/* ── Row 3: Freight Rate Cards ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Truck className="text-primary" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-text-main">Freight Rate Cards</h2>
        </div>
        
      </div>
    </div>
  );
}