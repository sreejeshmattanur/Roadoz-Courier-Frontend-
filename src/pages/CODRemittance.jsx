import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, Calendar, RotateCcw, Loader2, Eye } from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import { fetchRemittanceData } from "../redux/remittanceSlice";
import { usePermission } from "../hooks/usePermission";

export function CODRemittance() {
  const dispatch = useDispatch();
  const { remittances: remittancePerms } = usePermission();
  const { items, summary, pagination, loading } = useSelector((state) => state.remittance);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    order_ids: "",
    startDate: "",
    endDate: "",
  });

  const loadData = useCallback((currentFilters) => {
    const params = {
      page: currentFilters.page,
      limit: currentFilters.limit,
      order_id: currentFilters.order_ids || undefined,
      start_date: currentFilters.startDate || undefined,
      end_date: currentFilters.endDate || undefined,
    };
    dispatch(fetchRemittanceData(params));
  }, [dispatch]);

  useEffect(() => {
    loadData(filters);
  }, [filters.page, filters.limit, loadData]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadData({ ...filters, page: 1 });
  };

  const clearFilters = () => {
    const defaults = { page: 1, limit: 25, order_ids: "", startDate: "", endDate: "" };
    setFilters(defaults);
    loadData(defaults);
  };

  const handleExport = () => {
    const headers = ["Batch ID", "Total Amount", "Orders Count", "Status", "Created At", "Remarks"];
    const rows = items.map(i => [
      i.id,
      i.total_amount,
      i.orders_count,
      i.status.toUpperCase(),
      new Date(i.created_at).toLocaleDateString(),
      `"${i.remarks || ''}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `remittance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const summaryCards = [
    { title: "Remitted Till Date", value: `₹ ${summary.remittedTillDate.toLocaleString()}`, sub: `${summary.remittedOrders} Orders` },
    { title: "Remitted For", value: `${summary.remittedOrders} Orders`, sub: "" },
    { title: "Total Remittance Due", value: `₹ ${summary.dueAmount.toLocaleString()}`, sub: "" },
    { title: "Remittance Due For", value: `${summary.dueOrders} Orders`, sub: "" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Remittance Transactions</h1>
        <p className="text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">Dashboard</Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> Remittance Transactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((item, idx) => (
          <Card key={idx} className="bg-card-bg border-border-subtle shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">{item.title}</h3>
              <p className="text-2xl font-bold text-text-main">{item.value}</p>
              {item.sub && <p className="text-xs text-primary font-bold mt-1">{item.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-main">
              Remittance History (Showing {items.length} Out Of {pagination.total})
            </h2>
            {remittancePerms.manage && (
              <Button 
                onClick={handleExport}
                className="bg-primary text-black h-9 px-4 text-xs font-bold rounded-md flex items-center gap-2"
              >
                <Download size={14} /> Export CSV
              </Button>
            )}
          </div>

          <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-text-muted">Date Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    className="w-full bg-card-bg border border-border-subtle rounded-md px-2 py-2 text-xs text-text-main outline-none"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  />
                  <span className="text-text-muted">-</span>
                  <input 
                    type="date" 
                    className="w-full bg-card-bg border border-border-subtle rounded-md px-2 py-2 text-xs text-text-main outline-none"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-text-muted">Order ID(s)</label>
                <input 
                  type="text" 
                  placeholder="Comma separated IDs" 
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main outline-none"
                  value={filters.order_ids}
                  onChange={(e) => setFilters({...filters, order_ids: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Limit</label>
                <select 
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main outline-none"
                  value={filters.limit}
                  onChange={(e) => setFilters({...filters, limit: e.target.value})}
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="bg-primary text-black h-9 w-full text-xs font-bold rounded-md">Search</Button>
              </div>
            </div>
            <button onClick={clearFilters} className="text-xs font-bold text-primary flex items-center gap-1 mt-4 hover:underline">
              <RotateCcw size={14} /> Clear Filters
            </button>
          </div>

          <div className="overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase border-b border-border-subtle">
                  <th className="px-6 py-4">Batch ID / Order ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-dashboard-bg/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-main truncate w-32">#{item.id.slice(-8)}</div>
                        <div className="text-[10px] text-text-muted">Ref: {item.reference_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-text-main">₹ {item.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">{item.orders_count} Orders</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          item.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">{item.remarks}</td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" className="h-8 w-8 p-0 text-primary hover:bg-primary/10">
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-text-muted italic">
                      No remittance batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(p) => setFilters({...filters, page: p})}
          />
        </CardContent>
      </Card>
    </div>
  );
}