import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Download, Table, Filter, Loader2, 
  FileSpreadsheet, FileText, BarChart3, Truck, 
  Settings, Wallet, Landmark, ShieldCheck, 
  Briefcase, Database, TrendingUp, AlertCircle, User, Calendar,
  ArrowUpRight, Landmark as BankIcon
} from "lucide-react";

import { fetchReportData, clearReportData } from "../redux/reportsSlice";
import { getFranchises } from "../redux/franchiseSlice";
import { downloadReportFile } from "../services/reportService";

const REPORT_CATEGORIES = [
  { id: 'bookings', name: 'Booking Reports', icon: <Database size={16} />, options: [
    { label: 'Daily Bookings', path: "/bookings/daily", fields: ['report_date', 'date_from', 'date_to', 'franchise_id'] },
    { label: 'Customer Wise', path: "/bookings/customer-wise", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Service Performance', path: "/bookings/service-type", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]},
  { id: 'delivery', name: 'Delivery Reports', icon: <Truck size={16} />, options: [
    { label: 'Delivery Status', path: "/delivery/status", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Pending Shipments', path: "/delivery/pending", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Returned (RTO)', path: "/delivery/returned", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]},
  { id: 'operations', name: 'Operations Reports', icon: <Settings size={16} />, options: [
    { label: 'Day Close', path: "/operations/day-close", fields: ['report_date', 'franchise_id'] },
    { label: 'Branch Activity', path: "/operations/branch-activity", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'User Activity', path: "/operations/user-activity", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]},
  { id: 'collections', name: 'Collections & COD', icon: <Wallet size={16} />, options: [
    { label: 'Collections Summary', path: "/collections/summary", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Outstanding Invoices', path: "/collections/outstanding", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Daily Cash Book', path: "/collections/daily", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'COD Pending', path: "/cod/pending", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'COD Settlement', path: "/cod/settlement", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'COD Commission', path: "/cod/commission", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]},
  { id: 'finance', name: 'Finance & Accounts', icon: <Landmark size={16} />, options: [
    { label: 'Cash Book', path: "/finance/cash-book", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Expense Report', path: "/finance/expense", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Profit & Loss', path: "/finance/profit-loss", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]},
  { id: 'gst', name: 'GST Reports', icon: <ShieldCheck size={16} />, options: [
    { label: 'GST Sales', path: "/gst/sales", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'HSN Summary', path: "/gst/hsn-summary", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Collection Summary', path: "/gst/collection-summary", fields: ['year', 'franchise_id'] },
  ]},
  { id: 'franchise_mgmt', name: 'Franchise Management', icon: <Briefcase size={16} />, options: [
    { label: 'Franchise Settlement', path: "/franchise/settlement", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Franchise Outstanding', path: "/franchise/outstanding", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Franchise Collection', path: "/franchise/collection", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Franchise Profitability', path: "/franchise/profitability", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]},
  { id: 'mis', name: 'MIS Reports', icon: <BarChart3 size={16} />, options: [
    { label: 'Monthly Revenue', path: "/mis/monthly-revenue", fields: ['year', 'franchise_id'] },
    { label: 'Top Customers', path: "/mis/top-customers", fields: ['limit', 'date_from', 'date_to', 'franchise_id'] },
    { label: 'Delivery Efficiency', path: "/mis/delivery-efficiency", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Area-Wise Business', path: "/mis/area-wise-business", fields: ['date_from', 'date_to', 'franchise_id'] },
    { label: 'Performance Dashboard', path: "/mis/performance-dashboard", fields: ['date_from', 'date_to', 'franchise_id'] },
  ]}
];

export function Reports() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.reports);
  const { items: franchises } = useSelector((state) => state.franchise);

  const [selectedReport, setSelectedReport] = useState(REPORT_CATEGORIES[0].options[0]);
  const [filters, setFilters] = useState({
    report_date: new Date().toISOString().split('T')[0],
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    franchise_id: "",
    year: new Date().getFullYear().toString(),
    limit: 10
  });

  useEffect(() => {
    dispatch(getFranchises({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearReportData());
  }, [selectedReport, dispatch]);

  const getSanitizedParams = (formatType = 'json') => {
    const params = { format: formatType };
    const activeFields = selectedReport.fields;
    if (activeFields.includes('report_date')) params.report_date = filters.report_date;
    if (activeFields.includes('date_from')) params.date_from = filters.date_from;
    if (activeFields.includes('date_to')) params.date_to = filters.date_to;
    if (activeFields.includes('year')) params.year = filters.year;
    if (activeFields.includes('limit')) params.limit = filters.limit;
    if (activeFields.includes('franchise_id') && filters.franchise_id) params.franchise_id = filters.franchise_id;
    return params;
  };

  const handleFetchPreview = () => {
    dispatch(fetchReportData({ endpoint: `/reports${selectedReport.path}`, params: getSanitizedParams('json') }));
  };

  const handleExport = (format) => {
    downloadReportFile(`/reports${selectedReport.path}`, getSanitizedParams(format), format);
  };

  const summaryMetrics = useMemo(() => {
    if (!data || Array.isArray(data)) return [];
    return Object.entries(data)
      .filter(([key]) => key.startsWith('opening_') || key.startsWith('total_'))
      .map(([key, value]) => ({
        label: key.replace(/_/g, ' '),
        value: value,
        icon: key.includes('amount') || key.includes('revenue') ? <Wallet size={16}/> : <TrendingUp size={16}/>
      }));
  }, [data]);

  const reportItems = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.items || [];
  }, [data]);

  const tableHeaders = useMemo(() => reportItems.length > 0 ? Object.keys(reportItems[0]) : [], [reportItems]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Reports & Analytics</h1>
        <p className="text-xs md:text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">Dashboard</Link>
          <span className="text-text-muted mx-2">/</span> Reports Center
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-3">
          <Card className="bg-card-bg border-border-subtle shadow-xl sticky top-6">
            <CardContent className="p-3 overflow-y-auto max-h-[80vh] custom-scrollbar">
              {REPORT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-5">
                  <div className="flex items-center gap-2 px-3 mb-2 opacity-60">
                    {cat.icon}
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">{cat.name}</h3>
                  </div>
                  <div className="space-y-1">
                    {cat.options.map((opt) => (
                      <button key={opt.label} onClick={() => setSelectedReport(opt)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs transition-all ${
                          selectedReport.label === opt.label ? "bg-primary text-black font-black" : "text-text-main hover:bg-dashboard-bg"
                        }`}>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <Card className="bg-card-bg border-border-subtle shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-6">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><Filter size={24} /></div>
                <div>
                  <h2 className="text-xl font-black text-text-main uppercase">{selectedReport.label}</h2>
                  <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">Parameter Configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-dashboard-bg/30 p-6 rounded-2xl border border-border-subtle">
                
                {selectedReport.fields.includes('report_date') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-text-muted"/><label className="text-[10px] font-black text-text-muted uppercase">Report Date</label></div>
                    <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/50"
                      value={filters.report_date} onChange={(e) => setFilters({...filters, report_date: e.target.value})} />
                  </div>
                )}

                {selectedReport.fields.includes('date_from') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-text-muted"/><label className="text-[10px] font-black text-text-muted uppercase">Date From</label></div>
                    <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/50"
                      value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})} />
                  </div>
                )}

                {selectedReport.fields.includes('date_to') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-text-muted"/><label className="text-[10px] font-black text-text-muted uppercase">Date To</label></div>
                    <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/50"
                      value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})} />
                  </div>
                )}

                {selectedReport.fields.includes('franchise_id') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><User size={14} className="text-text-muted"/><label className="text-[10px] font-black text-text-muted uppercase">Franchise ID</label></div>
                    <select className="w-full bg-card-bg border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none cursor-pointer"
                      style={{ borderColor: filters.franchise_id ? '#eab308' : '#262626' }}
                      value={filters.franchise_id} onChange={(e) => setFilters({...filters, franchise_id: e.target.value})}>
                      <option value="">Optional: All Franchises</option>
                      {franchises?.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                    </select>
                  </div>
                )}

                {selectedReport.fields.includes('year') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-text-muted"/><label className="text-[10px] font-black text-text-muted uppercase">Year</label></div>
                    <select className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/50"
                      value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}>
                      {["2023", "2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-border-subtle flex flex-col xl:flex-row items-center gap-6">
                <Button onClick={handleFetchPreview} disabled={loading} className="w-full xl:w-auto bg-primary text-black font-black h-14 px-10 rounded-xl uppercase tracking-widest text-xs">
                  {loading ? <Loader2 className="animate-spin mr-3" size={18} /> : <Table className="mr-3" size={18} />} PREVIEW DATA STREAM
                </Button>
                <div className="flex gap-2 w-full xl:w-auto xl:ml-auto">
                   <Button variant="outline" onClick={() => handleExport('excel')} className="flex-1 bg-card-bg border-border-subtle hover:bg-emerald-600/10 hover:border-emerald-600 h-14 rounded-xl group transition-all">
                    <FileSpreadsheet size={18} className="mr-2 group-hover:text-emerald-500" /> <span className="text-[10px] font-bold uppercase">Excel</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('pdf')} className="flex-1 bg-card-bg border-border-subtle hover:bg-rose-600/10 hover:border-rose-600 h-14 rounded-xl group transition-all">
                    <FileText size={18} className="mr-2 group-hover:text-rose-500" /> <span className="text-[10px] font-bold uppercase">PDF</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('csv')} className="flex-1 bg-card-bg border-border-subtle hover:bg-sky-600/10 hover:border-sky-600 h-14 rounded-xl group transition-all">
                    <Download size={18} className="mr-2 group-hover:text-sky-500" /> <span className="text-[10px] font-bold uppercase">CSV</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {summaryMetrics.length > 0 && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {summaryMetrics.map((m, idx) => <SummaryCard key={idx} label={m.label} value={m.value} icon={m.icon} />)}
            </div>
          )}

          <Card className="bg-card-bg border-border-subtle shadow-2xl overflow-hidden rounded-2xl border-t-4 border-t-primary">
            <CardContent className="p-0">
              {loading ? (
                <div className="h-72 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-primary" size={40} />
                  <p className="text-text-muted font-black text-[10px] uppercase tracking-widest">Processing Data...</p>
                </div>
              ) : reportItems.length > 0 ? (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="sticky top-0 bg-[#171717] z-10">
                        {tableHeaders.map((key) => <th key={key} className="px-6 py-5 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">{key.replace(/_/g, ' ')}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/30">
                      {reportItems.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/[0.02] transition-colors">
                          {Object.values(row).map((val, idx) => <td key={idx} className="px-6 py-4 text-xs text-text-main font-medium whitespace-nowrap">{val === null ? "-" : String(val)}</td>)}
                        </tr>
                      ))}
                      {data?.totals && (
                        <tr className="bg-primary/5 font-black border-t-2 border-primary/20">
                          {tableHeaders.map((key, idx) => (
                            <td key={idx} className="px-6 py-5 text-xs text-primary">
                              {idx === 0 ? "TOTALS" : (data.totals[key] !== undefined ? data.totals[key].toLocaleString() : "")}
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center opacity-20 space-y-4">
                  <Database size={64} strokeWidth={1} /><p className="text-[10px] font-black uppercase tracking-widest">Select parameters to fetch data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <Card className="bg-card-bg border-border-subtle">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>
        <div>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest truncate max-w-[150px]">{label}</p>
          <p className="text-base font-black text-text-main">{typeof value === 'number' ? `₹${value.toLocaleString()}` : value}</p>
        </div>
      </CardContent>
    </Card>
  );
}