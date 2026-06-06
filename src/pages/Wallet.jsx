import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, RotateCcw, Loader2, Calendar as CalendarIcon } from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import { fetchTransactions } from "../redux/walletSlice";
import { usePermission } from "../hooks/usePermission";

export function Wallet() {
  const dispatch = useDispatch();
  const { wallet: walletPerms } = usePermission();
  const { transactions, pagination, loading } = useSelector((state) => state.wallet);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    type: "All",
    order_ids: "",
    startDate: "", 
    endDate: "",
  });

  const loadData = useCallback((currentFilters) => {
    const params = {
      page: currentFilters.page,
      limit: currentFilters.limit,
      type: currentFilters.type !== "All" ? currentFilters.type.toLowerCase() : undefined,
      order_id: currentFilters.order_ids || undefined,
      start_date: currentFilters.startDate || undefined,
      end_date: currentFilters.endDate || undefined,
    };
    dispatch(fetchTransactions(params));
  }, [dispatch]);

  useEffect(() => {
    loadData(filters);
  }, [filters.page, filters.limit, loadData]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadData({ ...filters, page: 1 });
  };

  const clearFilters = () => {
    const defaultFilters = { 
        page: 1, 
        limit: 25, 
        type: "All", 
        order_ids: "", 
        startDate: "", 
        endDate: "" 
    };
    setFilters(defaultFilters);
    loadData(defaultFilters);
  };

  const handleExport = () => {
    if (transactions.length === 0) return alert("No data to export");

    const headers = ["Transaction ID", "Amount", "Type", "Opening Balance", "Closing Balance", "Description", "Date"];
    const rows = transactions.map(t => [
      t.id,
      t.amount,
      t.type.toUpperCase(),
      t.opening_balance,
      t.closing_balance,
      `"${t.description || ''}"`,
      new Date(t.created_at).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wallet_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options).replace(',', '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Wallet Transactions</h1>
        <p className="text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline cursor-pointer">Dashboard</Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> Wallet Transactions
        </p>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-main">
              Wallet Transactions (Showing {transactions.length} Out Of {pagination.total})
            </h2>
            {walletPerms.manage && (
              <Button 
                onClick={handleExport}
                disabled={loading || transactions.length === 0}
                className="bg-primary hover:bg-primary/90 text-black h-9 px-4 text-xs font-bold rounded-md flex items-center gap-2"
              >
                <Download size={14} /> Export CSV
              </Button>
            )}
          </div>

          <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-text-muted flex items-center gap-1">
                  <CalendarIcon size={12} /> Date Range (From - To)
                </label>
                <div className="flex items-center gap-2">
                    <input 
                    type="date" 
                    className="w-full bg-card-bg border border-border-subtle rounded-md px-2 py-2 text-xs text-text-main focus:ring-1 focus:ring-primary outline-none appearance-none"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    />
                    <span className="text-text-muted text-xs">to</span>
                    <input 
                    type="date" 
                    className="w-full bg-card-bg border border-border-subtle rounded-md px-2 py-2 text-xs text-text-main focus:ring-1 focus:ring-primary outline-none appearance-none"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-xs font-medium text-text-muted">Order IDs</label>
                <input 
                  type="text" 
                  placeholder="ID1, ID2..." 
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:ring-1 focus:ring-primary outline-none"
                  value={filters.order_ids}
                  onChange={(e) => setFilters({...filters, order_ids: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Type</label>
                <select 
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:ring-1 focus:ring-primary outline-none"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="All">All Types</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Limit</label>
                <input 
                  type="number" 
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:ring-1 focus:ring-primary outline-none"
                  value={filters.limit}
                  onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value) || 25})}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  className="bg-primary text-black h-9 w-full text-xs font-bold rounded-md hover:bg-primary/90"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
            
            <button 
              onClick={clearFilters}
              className="text-xs font-bold text-primary flex items-center gap-1 mt-4 hover:underline transition-all"
            >
              <RotateCcw size={14} /> Reset All Filters
            </button>
          </div>

          <div className="overflow-x-auto relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-10 backdrop-blur-[1px]">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase border-b border-border-subtle">
                  <th className="px-6 py-4">Transaction Id</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Opening</th>
                  <th className="px-6 py-4">Closing</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-dashboard-bg/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-text-muted font-mono">
                        #{t.id?.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-text-main">
                        Rs. {t.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          t.type === 'debit' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">Rs. {t.opening_balance}</td>
                      <td className="px-6 py-4 text-sm font-bold text-text-main">Rs. {t.closing_balance}</td>
                      <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">
                        {t.description || (t.order_id ? `Order: ${t.order_id}` : "System Recharge")}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-lg">Empty Records</span>
                        <p className="text-xs uppercase tracking-widest opacity-60">No transactions found for the selected criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(newPage) => setFilters({ ...filters, page: newPage })}
          />
        </CardContent>
      </Card>
    </div>
  );
}