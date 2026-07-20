import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Eye, Trash2, Filter, RotateCcw,
  Download, Printer, Loader2, Truck, Navigation, 
  Edit, X, ShieldAlert, Calendar
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { swalConfirm, swalSuccess, swalError } from "../lib/swal";
import { cn } from "../lib/utils";
import { getTripSheets, removeTripSheet } from "../redux/tripSlice";
import { fetchTripSheetDetailsApi } from "../services/apiCalls";
import { generateTripSheetPrint } from "../lib/PrintTripSheet";
import Pagination from "../components/ui/Pagination";
import { usePermission } from "../hooks/usePermission";

export default function TripSheetRegistry() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trip: tripPerms } = usePermission(); // Assuming 'trip' permission key
  const { view: canView, create: canCreate, edit: canEdit, delete: canDelete } = tripPerms || { view: true, create: true, edit: true, delete: true };

  const { items, loading, pagination } = useSelector((state) => state.trip);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [previewTrip, setPreviewTrip] = useState(null);

  useEffect(() => {
    if (canView) fetchData();
  }, [canView]);

  const fetchData = (customParams = {}) => {
    const params = {
      page: customParams.page || 1,
      limit: 10,
      search: searchTerm || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      ...customParams,
    };
    dispatch(getTripSheets(params));
  };

  const handleDelete = async (id) => {
    const confirmed = await swalConfirm("Delete Trip Sheet?", "Manifest records will be cleared. This cannot be undone.");
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

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-text-main">Access Denied</h2>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary text-black">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Trip Manifest Registry</h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Trip Management
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs">
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          {canCreate && (
            <Button onClick={() => navigate("/dashboard/trip/create")} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs">
              <Plus size={18} className="mr-2" /> New Trip
            </Button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-card-bg border-border-subtle shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">Search Manifest</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="ID, Vehicle..."
                  className="w-full bg-card-bg border border-border-subtle rounded-md pl-9 pr-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">From Date</label>
              <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:border-primary outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">To Date</label>
              <input type="date" className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:border-primary outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchData({ page: 1 })} className="flex-1 bg-primary text-black h-9 text-xs font-bold rounded-md">Search</Button>
              <button onClick={() => { setSearchTerm(""); setStartDate(""); setEndDate(""); fetchData({page:1}); }} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><RotateCcw size={14} /> Clear</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-dashboard-bg/60 border-b border-border-subtle">
                <tr className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-4 px-6 text-left">Manifest ID</th>
                  <th className="py-4 px-6 text-left">Vehicle & Driver</th>
                  <th className="py-4 px-6 text-left">Destination</th>
                  <th className="py-4 px-6 text-left">Load Stats</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={40} /></td></tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.id} className="hover:bg-dashboard-bg/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-[13px] font-mono text-primary font-bold">#TRP-{t.id.slice(0, 6).toUpperCase()}</span>
                        <div className="text-[11px] text-text-muted mt-0.5">{new Date(t.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[14px] font-bold text-text-main">{t.vehicle?.plate_number}</div>
                        <div className="text-[11px] text-text-muted uppercase">{t.driver?.first_name} {t.driver?.last_name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[13px] text-text-main font-bold flex items-center gap-1"><Navigation size={12} className="text-primary"/> {t.destination_franchise?.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[13px] font-bold text-text-main">{t.total_packages} Pkts</div>
                        <div className="text-[11px] text-green-500 font-bold">₹{t.total_freight?.toFixed(2)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => openPreview(t.id)} className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all">
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <button onClick={() => navigate(`/dashboard/trip/edit/${t.id}`)} className="w-8 h-8 flex items-center justify-center text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                              <Edit size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(t.id)} className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && items.length === 0 && (
                  <tr><td colSpan="5" className="py-20 text-center text-text-muted text-sm">No manifests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {items.length > 0 && (
            <Pagination currentPage={pagination?.page || 1} totalPages={pagination?.pages || 1} onPageChange={(p) => fetchData({ page: p })} />
          )}
        </CardContent>
      </Card>

      {/* DETAIL PREVIEW MODAL (Same as Consignee Modal Style) */}
      <AnimatePresence>
        {previewTrip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card-bg rounded-xl w-full max-w-4xl border border-border-subtle overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-border-subtle">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2"><Truck className="text-primary"/> Manifest: TRP-{previewTrip.id.slice(0,8)}</h3>
                <button onClick={() => setPreviewTrip(null)} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-card-bg">
                <div className="space-y-4">
                  <div className="p-4 bg-dashboard-bg border border-border-subtle rounded-xl">
                    <label className="text-[10px] font-bold text-primary uppercase">Driver</label>
                    <p className="text-sm font-bold text-text-main">{previewTrip.driver?.first_name} {previewTrip.driver?.last_name}</p>
                    <p className="text-xs text-text-muted">{previewTrip.driver?.phone}</p>
                  </div>
                  <div className="p-4 bg-dashboard-bg border border-border-subtle rounded-xl">
                    <label className="text-[10px] font-bold text-primary uppercase">Vehicle</label>
                    <p className="text-sm font-bold text-text-main">{previewTrip.vehicle?.plate_number}</p>
                    <p className="text-xs text-text-muted">{previewTrip.vehicle?.model}</p>
                  </div>
                  <Button onClick={() => generateTripSheetPrint(previewTrip)} className="w-full bg-primary text-black font-bold h-11"><Printer size={16} className="mr-2"/> Print Statement</Button>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-bold text-text-muted uppercase">Origin</p>
                      <p className="text-sm font-black text-text-main">{previewTrip.franchise?.name}</p>
                    </div>
                    <Navigation size={16} className="text-primary rotate-90" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] font-bold text-text-muted uppercase">Target</p>
                      <p className="text-sm font-black text-text-main">{previewTrip.destination_franchise?.name}</p>
                    </div>
                  </div>
                  <div className="border border-border-subtle rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-dashboard-bg text-[10px] uppercase font-bold text-text-muted">
                        <tr>
                          <th className="p-3 px-4">Order No</th>
                          <th className="p-3">Consignee</th>
                          <th className="p-3 text-right px-4">Freight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {previewTrip.orders?.map(o => (
                          <tr key={o.id} className="hover:bg-dashboard-bg/50">
                            <td className="p-3 px-4 font-mono text-primary font-bold">{o.order_number}</td>
                            <td className="p-3 text-text-main">{o.consignee?.name}</td>
                            <td className="p-3 text-right px-4 font-bold text-text-main">₹{o.total_freight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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