import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Calendar, Download, Table, Filter, Loader2, 
  ChevronRight, FileSpreadsheet, FileText, ChevronDown, 
  BarChart3, AlertCircle, Truck, Settings, Wallet, 
  Landmark, ShieldCheck, Briefcase, Database, Users
} from "lucide-react";
import { ENDPOINTS } from "../services/endpoints";
import { fetchReportData, clearReportData } from "../redux/reportsSlice";
import { downloadReportFile } from "../services/reportService";

const REPORT_CATEGORIES = [
  { id: 'bookings', name: 'Booking Reports', icon: <Database size={16} />, options: [
    { label: 'Daily Bookings', path: ENDPOINTS.REPORTS.BOOKINGS.DAILY, fields: ['date', 'franchise'] },
    { label: 'Customer Wise', path: ENDPOINTS.REPORTS.BOOKINGS.CUSTOMER_WISE, fields: ['range', 'franchise'] },
    { label: 'Service Performance', path: ENDPOINTS.REPORTS.BOOKINGS.SERVICE_TYPE, fields: ['range', 'franchise'] },
  ]},
  { id: 'delivery', name: 'Delivery Reports', icon: <Truck size={16} />, options: [
    { label: 'Delivery Status', path: ENDPOINTS.REPORTS.DELIVERY.STATUS, fields: ['range', 'franchise'] },
    { label: 'Pending Shipments', path: ENDPOINTS.REPORTS.DELIVERY.PENDING, fields: ['franchise'] },
    { label: 'Returned (RTO)', path: ENDPOINTS.REPORTS.DELIVERY.RETURNED, fields: ['range', 'franchise'] },
  ]},
  { id: 'operations', name: 'Operations Reports', icon: <Settings size={16} />, options: [
    { label: 'Day Close', path: ENDPOINTS.REPORTS.OPERATIONS.DAY_CLOSE, fields: ['date', 'franchise'] },
    { label: 'Branch Activity', path: ENDPOINTS.REPORTS.OPERATIONS.BRANCH_ACTIVITY, fields: ['range'] },
    { label: 'User Activity', path: ENDPOINTS.REPORTS.OPERATIONS.USER_ACTIVITY, fields: ['range'] },
  ]},
  { id: 'collections', name: 'Collections & COD', icon: <Wallet size={16} />, options: [
    { label: 'Collections Summary', path: ENDPOINTS.REPORTS.COLLECTIONS.SUMMARY, fields: ['range', 'franchise'] },
    { label: 'Outstanding Invoices', path: ENDPOINTS.REPORTS.COLLECTIONS.OUTSTANDING, fields: ['franchise'] },
    { label: 'Daily Cash Book', path: ENDPOINTS.REPORTS.COLLECTIONS.DAILY, fields: ['range', 'franchise'] },
    { label: 'COD Pending', path: ENDPOINTS.REPORTS.COLLECTIONS.COD_PENDING, fields: ['franchise'] },
    { label: 'COD Settlement', path: ENDPOINTS.REPORTS.COLLECTIONS.COD_SETTLEMENT, fields: ['franchise'] },
    { label: 'COD Commission', path: ENDPOINTS.REPORTS.COLLECTIONS.COD_COMMISSION, fields: ['franchise'] },
  ]},
  { id: 'finance', name: 'Finance & Accounts', icon: <Landmark size={16} />, options: [
    { label: 'Main Cash Book', path: ENDPOINTS.REPORTS.FINANCE.CASH_BOOK, fields: ['range', 'franchise'] },
    { label: 'Expense Breakdown', path: ENDPOINTS.REPORTS.FINANCE.EXPENSE, fields: ['range', 'franchise'] },
    { label: 'Profit & Loss', path: ENDPOINTS.REPORTS.FINANCE.PROFIT_LOSS, fields: ['range', 'franchise'] },
  ]},
  { id: 'gst', name: 'GST Reports', icon: <ShieldCheck size={16} />, options: [
    { label: 'GST Sales', path: ENDPOINTS.REPORTS.GST.SALES, fields: ['range', 'franchise'] },
    { label: 'HSN Summary', path: ENDPOINTS.REPORTS.GST.HSN_SUMMARY, fields: ['range', 'franchise'] },
    { label: 'GST Collection Summary', path: ENDPOINTS.REPORTS.GST.COLLECTION_SUMMARY, fields: ['year', 'franchise'] },
  ]},
  { id: 'franchise_mgmt', name: 'Franchise Management', icon: <Briefcase size={16} />, options: [
    { label: 'HO Settlement', path: ENDPOINTS.REPORTS.FRANCHISE.SETTLEMENT, fields: ['range', 'franchise'] },
    { label: 'Branch Outstanding', path: ENDPOINTS.REPORTS.FRANCHISE.OUTSTANDING, fields: ['franchise'] },
    { label: 'Branch Collection', path: ENDPOINTS.REPORTS.FRANCHISE.COLLECTION, fields: ['franchise'] },
    { label: 'Branch Profitability', path: ENDPOINTS.REPORTS.FRANCHISE.PROFITABILITY, fields: ['franchise'] },
  ]},
  { id: 'mis', name: 'MIS Reports', icon: <BarChart3 size={16} />, options: [
    { label: 'Monthly Revenue', path: ENDPOINTS.REPORTS.MIS.MONTHLY_REVENUE, fields: ['year', 'franchise'] },
    { label: 'Top Customers', path: ENDPOINTS.REPORTS.MIS.TOP_CUSTOMERS, fields: ['limit', 'range', 'franchise'] },
    { label: 'Delivery Efficiency', path: ENDPOINTS.REPORTS.MIS.DELIVERY_EFFICIENCY, fields: ['range', 'franchise'] },
    { label: 'Area-Wise Business', path: ENDPOINTS.REPORTS.MIS.AREA_WISE, fields: ['franchise'] },
    { label: 'Performance Dashboard', path: ENDPOINTS.REPORTS.MIS.PERFORMANCE, fields: ['franchise'] },
  ]}
];

export function Reports() {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.reports);

  const [selectedReport, setSelectedReport] = useState(REPORT_CATEGORIES[0].options[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    report_date: new Date().toISOString().split('T')[0],
    date_from: "",
    date_to: "",
    franchise_id: "",
    year: new Date().getFullYear(),
    limit: 10
  });

  useEffect(() => {
    dispatch(clearReportData());
  }, [selectedReport, dispatch]);

  const handleFetchPreview = () => {
    dispatch(fetchReportData({ endpoint: selectedReport.path, params: filters }));
  };

  const handleExport = (format) => {
    downloadReportFile(selectedReport.path, filters, format);
  };

  const tableHeaders = useMemo(() => {
    if (data?.items?.length > 0) return Object.keys(data.items[0]);
    return [];
  }, [data]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase italic">Intelligence <span className="text-primary">Center</span></h1>
          <nav className="flex items-center text-[10px] text-text-muted mt-2 font-black uppercase tracking-widest">
            <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
            <ChevronRight size={12} className="mx-2" />
            <span className="text-text-main">Reporting Node</span>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-3 space-y-4">
          <div className="lg:hidden">
            <Button 
              variant="outline" 
              className="w-full justify-between bg-card-bg text-text-main border-border-subtle h-14 font-bold rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-primary" />
                {selectedReport.label}
              </div>
              <ChevronDown size={18} className={`transition-transform duration-300 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <Card className={`lg:block bg-card-bg border-border-subtle shadow-2xl overflow-hidden transition-all duration-500 ${mobileMenuOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 lg:max-h-[85vh] opacity-0 lg:opacity-100'}`}>
            <CardContent className="p-3 overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-primary/10">
              {REPORT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-2 px-3 mb-2 opacity-60">
                    {cat.icon}
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main">
                        {cat.name}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {cat.options.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setSelectedReport(opt);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs transition-all duration-200 flex items-center justify-between group ${
                          selectedReport.label === opt.label 
                          ? "bg-primary text-black font-black shadow-lg shadow-primary/20" 
                          : "text-text-main hover:bg-dashboard-bg"
                        }`}
                      >
                        <span className="truncate pr-2">{opt.label}</span>
                        {selectedReport.label === opt.label && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
          
          <Card className="bg-card-bg border-border-subtle shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Filter size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-main leading-none uppercase tracking-tight">{selectedReport.label}</h2>
                  <p className="text-[10px] text-text-muted font-bold mt-2 uppercase tracking-[0.2em]">Parameter Configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 bg-dashboard-bg/30 p-6 rounded-2xl border border-border-subtle/50">
                {selectedReport.fields.includes('date') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12}/> Report Date
                    </label>
                    <input 
                      type="date" 
                      className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
                      value={filters.report_date}
                      onChange={(e) => setFilters({...filters, report_date: e.target.value})}
                    />
                  </div>
                )}
                {selectedReport.fields.includes('range') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12}/> From Date
                      </label>
                      <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner" 
                        onChange={(e) => setFilters({...filters, date_from: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12}/> To Date
                      </label>
                      <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner" 
                        onChange={(e) => setFilters({...filters, date_to: e.target.value})}/>
                    </div>
                  </>
                )}
                {selectedReport.fields.includes('franchise') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Users size={12}/> Franchise ID
                    </label>
                    <input 
                      type="text" 
                      placeholder="Optional: All Franchises"
                      className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
                      value={filters.franchise_id}
                      onChange={(e) => setFilters({...filters, franchise_id: e.target.value})}
                    />
                  </div>
                )}
                {selectedReport.fields.includes('year') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">Financial Year</label>
                    <select 
                       className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-inner appearance-none"
                       value={filters.year}
                       onChange={(e) => setFilters({...filters, year: e.target.value})}
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                {selectedReport.fields.includes('limit') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">Result Count</label>
                    <input 
                      type="number" 
                      className="w-full bg-card-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
                      value={filters.limit}
                      onChange={(e) => setFilters({...filters, limit: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-border-subtle flex flex-col xl:flex-row items-center gap-4">
                <Button 
                  onClick={handleFetchPreview} 
                  disabled={loading}
                  className="w-full xl:w-auto bg-primary text-black font-black h-14 px-10 rounded-xl hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin mr-3" size={20} /> : <Table className="mr-3" size={20} />}
                  PREVIEW DATA STREAM
                </Button>

                <div className="grid grid-cols-3 gap-2 w-full xl:w-auto xl:ml-auto">
                   <Button variant="outline" onClick={() => handleExport('excel')} className="bg-card-bg text-text-main border-border-subtle hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500 transition-all font-black text-[10px] h-14 rounded-xl">
                    <FileSpreadsheet size={18} className="mb-1 xl:mb-0 xl:mr-2" /> <span className="hidden sm:inline">EXCEL</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('pdf')} className="bg-card-bg text-text-main border-border-subtle hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500 transition-all font-black text-[10px] h-14 rounded-xl">
                    <FileText size={18} className="mb-1 xl:mb-0 xl:mr-2" /> <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('csv')} className="bg-card-bg text-text-main border-border-subtle hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500 transition-all font-black text-[10px] h-14 rounded-xl">
                    <Download size={18} className="mb-1 xl:mb-0 xl:mr-2" /> <span className="hidden sm:inline">CSV</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-500 animate-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <Card className="bg-card-bg border-border-subtle shadow-2xl overflow-hidden rounded-2xl border-t-4 border-t-primary">
             <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/40">
                <h3 className="font-black text-text-main text-[10px] tracking-[0.3em] uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> Live System Preview
                </h3>
                <span className="text-[10px] px-3 py-1 bg-primary/10 text-primary rounded-full font-black border border-primary/20 tracking-tighter uppercase">
                  {data?.items?.length || 0} Records Found
                </span>
             </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    <Database size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                  </div>
                  <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing Encrypted Datasets...</p>
                </div>
              ) : data?.items?.length > 0 ? (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="sticky top-0 z-10">
                        {tableHeaders.map((key) => (
                          <th key={key} className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle bg-dashboard-bg/95 backdrop-blur-sm">
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                      {data.items.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/[0.03] transition-colors group">
                          {Object.values(row).map((val, colIdx) => (
                            <td key={colIdx} className="px-6 py-4 text-xs text-text-main whitespace-nowrap font-bold tracking-tight">
                              {val === null || val === undefined ? (
                                <span className="opacity-20 italic">NULL</span>
                              ) : typeof val === 'number' ? (
                                <span className="text-primary font-mono">{val.toLocaleString()}</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-text-muted space-y-6 opacity-30">
                  <div className="p-8 bg-dashboard-bg rounded-full border border-border-subtle">
                    <Table size={64} strokeWidth={1} />
                  </div>
                  <p className="font-black text-[10px] tracking-[0.3em] uppercase">Ready for Input: Adjust filters to begin fetch</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary-rgb), 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary-rgb), 0.3); }
      `}</style>
    </div>
  );
}