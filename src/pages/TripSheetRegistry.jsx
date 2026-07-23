import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Eye, Trash2, RotateCcw,
  Printer, Loader2, Truck, Navigation, 
  Edit, X, ArrowDownLeft, ArrowUpRight, Building2
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { swalConfirm, swalSuccess, swalError } from "../lib/swal";
import { getTripSheets, removeTripSheet } from "../redux/tripSlice";
import { fetchTripSheetDetailsApi } from "../services/apiCalls";
import { generateTripSheetPrint } from "../lib/PrintTripSheet";
import Pagination from "../components/ui/Pagination";
import { usePermission } from "../hooks/usePermission";
import { cn } from "../lib/utils";

export default function TripSheetRegistry() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trip: tripPerms } = usePermission();
  const { view: canView, create: canCreate, edit: canEdit, delete: canDelete } = tripPerms || { view: true, create: true, edit: true, delete: true };

  const { items, loading, pagination } = useSelector((state) => state.trip);
  
  // State for Tabs
  const [activeTab, setActiveTab] = useState("outbound"); // "outbound" or "incoming"
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [previewTrip, setPreviewTrip] = useState(null);

  useEffect(() => {
    if (canView) fetchData();
  }, [canView, activeTab]);

  const fetchData = (customParams = {}) => {
    const params = {
      page: customParams.page || 1,
      limit: 10,
      type: activeTab, // This tells the API whether to fetch incoming or outbound
      search: searchTerm || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      ...customParams,
    };
    dispatch(getTripSheets(params));
  };

  const handleDelete = async (id) => {
    const confirmed = await swalConfirm("Delete Trip Sheet?", "Manifest records will be cleared.");
    if (confirmed) {
      try {
        await dispatch(removeTripSheet(id)).unwrap();
        swalSuccess("Deleted", "Trip sheet removed.");
        fetchData();
      } catch (err) {
        swalError("Error", err || "Failed to delete record.");
      }
    }
  };

  const openPreview = async (id) => {
    try {
      const res = await fetchTripSheetDetailsApi(id);
      setPreviewTrip(res);
    } catch (err) {
      swalError("Error", "Could not load trip details");
    }
  };

  // Helper to determine destination label based on priority
  const getDestinationLabel = (t) => {
    if (t.destination_franchise?.name) return t.destination_franchise.name;
    if (t.destination_city) return t.destination_city;
    return "N/A";
  };

  if (!canView) return <div className="p-20 text-center font-bold">Access Denied</div>;

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Manifest Registry</h1>
          <p className="text-xs text-primary font-medium flex items-center gap-1">
            <Truck size={12}/> Trip Management & Dispatch
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={() => navigate("/dashboard/trip/create")} className="bg-primary hover:bg-primary/90 text-black font-bold h-10 px-6 rounded-xl shadow-lg text-xs">
              <Plus size={18} className="mr-2" /> Create Manifest
            </Button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-dashboard-bg border border-border-subtle rounded-2xl w-full sm:w-fit">
        <button 
          onClick={() => setActiveTab("outbound")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === "outbound" ? "bg-primary text-black shadow-md" : "text-text-muted hover:text-text-main"
          )}
        >
          <ArrowUpRight size={16}/> Outbound
        </button>
        <button 
          onClick={() => setActiveTab("incoming")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === "incoming" ? "bg-primary text-black shadow-md" : "text-text-muted hover:text-text-main"
          )}
        >
          <ArrowDownLeft size={16}/> Incoming
        </button>
      </div>

      {/* Filters */}
      <Card className="bg-card-bg border-border-subtle rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Search Manifest</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="ID, Vehicle or Driver..."
                  className="w-full bg-dashboard-bg border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-xs text-text-main focus:border-primary outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">From Date</label>
                <input type="date" className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:border-primary outline-none h-[40px]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">To Date</label>
                <input type="date" className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:border-primary outline-none h-[40px]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchData({ page: 1 })} className="flex-1 bg-primary hover:bg-primary/90 text-black h-10 text-xs font-bold rounded-lg shadow-sm">Apply Filters</Button>
              <button onClick={() => { setSearchTerm(""); setStartDate(""); setEndDate(""); fetchData({page:1}); }} className="p-2.5 bg-dashboard-bg border border-border-subtle rounded-lg text-primary hover:bg-primary hover:text-black transition-colors"><RotateCcw size={18} /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-dashboard-bg/60 border-b border-border-subtle">
                <tr className="text-text-muted text-[10px] font-black uppercase tracking-[0.15em]">
                  <th className="py-5 px-6 text-left">Manifest Info</th>
                  <th className="py-5 px-6 text-left">Vehicle & Driver</th>
                  <th className="py-5 px-6 text-left">Destination</th>
                  <th className="py-5 px-6 text-left">Load Stats</th>
                  <th className="py-5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr><td colSpan="5" className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={40} /></td></tr>
                ) : items.length > 0 ? (
                  items.map((t) => (
                    <tr key={t.id} className="hover:bg-dashboard-bg/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", activeTab === 'outbound' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500')}>
                                {activeTab === 'outbound' ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                            </div>
                            <div>
                                <span className="text-[13px] font-mono text-primary font-bold">#TRP-{t.id.slice(0, 6).toUpperCase()}</span>
                                <div className="text-[11px] text-text-muted mt-0.5">{new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[14px] font-bold text-text-main">{t.vehicle?.plate_number}</div>
                        <div className="text-[11px] text-text-muted uppercase font-medium">{t.driver?.first_name} {t.driver?.last_name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                            <span className="text-[13px] text-text-main font-bold flex items-center gap-1.5">
                                <Navigation size={12} className="text-primary"/> 
                                {getDestinationLabel(t)}
                            </span>
                            {t.route_city?.length > 0 && (
                                <span className="text-[10px] text-text-muted italic mt-1">Via: {t.route_city.join(", ")}</span>
                            )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[13px] font-bold text-text-main">{t.total_packages || 0} Pkts</div>
                        <div className="text-[11px] text-green-500 font-bold">₹{(t.total_freight || 0).toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => openPreview(t.id)} className="w-9 h-9 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary hover:text-black transition-all"><Eye size={16} /></button>
                          
                          {/* Only show Edit/Delete for Outbound manifests */}
                          {activeTab === "outbound" && (
                            <>
                                {canEdit && <button onClick={() => navigate(`/dashboard/trip/edit/${t.id}`)} className="w-9 h-9 flex items-center justify-center text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><Edit size={16} /></button>}
                                {canDelete && <button onClick={() => handleDelete(t.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                        <div className="flex flex-col items-center opacity-20">
                            <Truck size={64}/>
                            <p className="text-sm font-bold uppercase tracking-widest mt-4">No {activeTab} Manifests Found</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {items.length > 0 && (
            <Pagination currentPage={pagination?.page || 1} totalPages={pagination?.pages || 1} onPageChange={(p) => fetchData({ page: p })} />
          )}
        </CardContent>
      </Card>

      {/* DETAIL PREVIEW MODAL */}
      <AnimatePresence>
        {previewTrip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card-bg rounded-2xl w-full max-w-5xl border border-border-subtle overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/50">
                <div>
                    <h3 className="text-xl font-bold text-text-main flex items-center gap-3"><Truck className="text-primary"/> Loading Manifest: <span className="font-mono">#TRP-{previewTrip.id.slice(0,8).toUpperCase()}</span></h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Created on {new Date(previewTrip.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setPreviewTrip(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Info Column */}
                  <div className="space-y-4">
                    <div className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest">Target Destination</label>
                      <p className="text-lg font-bold text-text-main mt-1 flex items-center gap-2"><Navigation size={18} className="text-text-muted"/> {getDestinationLabel(previewTrip)}</p>
                    </div>

                    <div className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest">Fleet & Logistics</label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-text-muted">Vehicle:</span> <span className="font-bold text-text-main">{previewTrip.vehicle?.plate_number}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-muted">Driver:</span> <span className="font-bold text-text-main">{previewTrip.driver?.first_name} {previewTrip.driver?.last_name}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-muted">Packages:</span> <span className="font-bold text-primary">{previewTrip.total_packages} Units</span></div>
                      </div>
                    </div>

                    {previewTrip.route_city?.length > 0 && (
                        <div className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Scheduled Route Cities</label>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {previewTrip.route_city.map(city => (
                                    <span key={city} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">{city}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button onClick={() => generateTripSheetPrint(previewTrip)} className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-12 rounded-xl shadow-lg mt-4">
                        <Printer size={18} className="mr-2"/> Print Statement
                    </Button>
                  </div>

                  {/* Right Orders Column */}
                  <div className="lg:col-span-2">
                    <div className="border border-border-subtle rounded-2xl overflow-hidden bg-dashboard-bg/30">
                      <div className="p-4 border-b border-border-subtle bg-dashboard-bg/50">
                        <h4 className="text-[10px] font-black uppercase text-text-main tracking-widest">Items Scanned in Manifest</h4>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-dashboard-bg text-[10px] uppercase font-bold text-text-muted sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 px-6">Order Number</th>
                                <th className="p-4">Consignee & City</th>
                                <th className="p-4 text-center">Pkts</th>
                                <th className="p-4 text-right px-6">Freight</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {previewTrip.orders?.length > 0 ? previewTrip.orders.map(o => (
                              <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                                <td className="p-4 px-6 font-mono text-primary font-bold">{o.order_number}</td>
                                <td className="p-4">
                                    <div className="text-text-main font-bold">{o.consignee?.name}</div>
                                    <div className="text-[10px] text-text-muted uppercase">{o.consignee?.city}</div>
                                </td>
                                <td className="p-4 text-center font-bold text-text-main">{o.total_boxes || 0}</td>
                                <td className="p-4 text-right px-6 font-bold text-green-500">₹{(o.total_freight || 0).toLocaleString()}</td>
                              </tr>
                            )) : (
                                <tr><td colSpan="4" className="p-10 text-center text-text-muted italic">No order details available</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-dashboard-bg/50 border-t border-border-subtle flex justify-between items-center px-6">
                        <span className="text-[10px] font-black uppercase text-text-muted">Total Manifest Value</span>
                        <span className="text-xl font-black text-primary">₹{(previewTrip.total_freight || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}