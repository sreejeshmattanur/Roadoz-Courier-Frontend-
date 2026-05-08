import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Calendar,
  Filter,
  RotateCcw,
  Loader2,
  History,
  User,
  Globe,
  Activity,
  Download,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";
import { getActivityLogs } from "../redux/activityLogSlice";
import Pagination from "../components/ui/Pagination";

export default function ActivityLogs() {
  const dispatch = useDispatch();

  const { items = [], loading = false, pagination = {} } = useSelector(
    (state) => state.activityLogs || {}
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const processedLogs = useMemo(() => {
    if (!items) return [];

    let filtered = [...items];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.description?.toLowerCase().includes(lowerSearch) ||
          log.method?.toLowerCase().includes(lowerSearch) ||
          log.user?.name?.toLowerCase().includes(lowerSearch) ||
          log.path?.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [items, searchTerm]);

  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  const fetchData = (customParams = {}) => {
    const params = {
      page: customParams.page || pagination.page || 1,
      limit: pagination.size || 50,
      search: searchTerm || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      ...customParams,
    };
    dispatch(getActivityLogs(params));
  };

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilter = () => {
    fetchData({ page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    dispatch(getActivityLogs({ page: 1, limit: 50 }));
  };

  const exportToCSV = () => {
    if (processedLogs.length === 0) return;

    const headers = ["Timestamp,User,Email,Method,Description,Endpoint,IP Address"];
    const rows = processedLogs.map((log) => {
      const timestamp = new Date(log.created_at).toLocaleString().replace(",", "");
      const userName = log.user?.name || "System";
      const userEmail = log.user?.email || "N/A";
      const method = log.method || "";
      const description = log.description?.replace(",", ";") || "";
      const path = log.path || "";
      const ip = log.ip_address || "";

      return `${timestamp},${userName},${userEmail},${method},${description},${path},${ip}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `activity_logs_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodColor = (method) => {
    const colors = {
      POST: "text-blue-500 bg-blue-500/10",
      GET: "text-green-500 bg-green-500/10",
      PUT: "text-orange-500 bg-orange-500/10",
      DELETE: "text-red-500 bg-red-500/10",
    };
    return colors[method] || "text-text-muted bg-text-muted/10";
  };

  const filterInputClass =
    "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            System Activity Logs
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Audit Trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={processedLogs.length === 0}
            className="border-border-subtle h-10 text-text-main text-xs"
          >
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Search Action</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Method or description..."
                  className={cn(filterInputClass, "pl-10")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="date"
                  className={cn(filterInputClass, "pl-9")}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="date"
                  className={cn(filterInputClass, "pl-9")}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleFilter} className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs font-bold">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-text-muted border border-border-subtle">
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-muted text-sm animate-pulse">Fetching system logs...</p>
        </div>
      ) : (
        <>
          <Card className="hidden md:block bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Endpoint</th>
                      <th className="px-6 py-4 text-center">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {processedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-dashboard-bg/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-xs font-mono font-bold text-text-main">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.user ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-text-main">{log.user.name}</span>
                              <span className="text-[10px] text-text-muted">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic bg-dashboard-bg px-2 py-0.5 rounded">
                              System / Anonymous
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter", getMethodColor(log.method))}>
                              {log.method}
                            </span>
                            <span className="text-xs font-medium text-text-main">{log.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-mono text-primary bg-primary/5 px-2 py-1 rounded truncate max-w-[200px]" title={log.path}>
                            {log.path}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-text-muted">
                            <Globe size={12} className="text-primary/70" /> {log.ip_address}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={pagination.page || 1}
                totalPages={pagination.pages || 1}
                totalEntries={pagination.total || 0}
                limit={pagination.size || 50}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>

          <div className="md:hidden space-y-4">
            {processedLogs.map((log) => (
              <Card key={log.id} className="bg-card-bg border-border-subtle overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", getMethodColor(log.method))}>
                      {log.method}
                    </span>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-text-main">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[9px] text-text-muted">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-text-main mb-3">{log.description}</p>
                  <div className="space-y-2 pt-3 border-t border-border-subtle/50">
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <User size={12} className="text-primary" />
                      <span className="font-medium text-text-main">{log.user?.name || "System"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <Activity size={12} className="text-primary" />
                      <span className="truncate font-mono bg-dashboard-bg px-1 rounded">{log.path}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Pagination
              currentPage={pagination.page || 1}
              totalPages={pagination.pages || 1}
              totalEntries={pagination.total || 0}
              limit={pagination.size || 50}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      {!loading && processedLogs.length === 0 && (
        <div className="py-20 text-center space-y-3 bg-card-bg rounded-2xl border border-dashed border-border-subtle">
          <div className="inline-flex p-4 rounded-full bg-dashboard-bg text-text-muted">
             <History size={32} />
          </div>
          <p className="text-text-muted font-bold text-sm uppercase tracking-widest">No matching logs found</p>
          <Button onClick={clearFilters} variant="link" className="text-primary text-xs">
            Reset all search filters
          </Button>
        </div>
      )}
    </div>
  );
}