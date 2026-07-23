import React, { useEffect, useState } from "react";
import { 
  Truck, Plus, Edit, Trash2, Loader2, Search, Eye,
  RotateCcw, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { fetchVehiclesApi, deleteVehicleApi } from "../services/apiCalls";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import { swalConfirm, swalSuccess, swalError } from "../lib/swal";
import VehicleModal from "../components/modals/VehicleModal";
import VehicleDetailsModal from "../components/modals/VehicleDetailsModal";

export default function VehicleRegistry() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Modals
  const [modal, setModal] = useState({ open: false, data: null });
  const [viewModal, setViewModal] = useState({ open: false, id: null });
  
  // Filters
  const [filters, setFilters] = useState({ plate_number: "", model: "", type: "", status: "" });

  const loadVehicles = async (page = 1) => {
    setLoading(true);
    try {
      const data = await fetchVehiclesApi({ page, limit: 10, ...filters });
      setVehicles(data.items || []);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      toast.error("Failed to load fleet registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicles(); }, []);

  const handleDelete = async (id) => {
    if (await swalConfirm("Delete Vehicle?", "Removal from registry cannot be undone.")) {
      try {
        await deleteVehicleApi(id);
        swalSuccess("Deleted", "Asset removed.");
        loadVehicles(pagination.page);
      } catch (err) { swalError("Error", "Action failed."); }
    }
  };

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Fleet Asset Registry</h1>
          <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase">Assets & Infrastructure</p>
        </div>
        <Button onClick={() => setModal({ open: true, data: null })} className="bg-primary text-black font-black h-12 px-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
          <Plus size={18} className="mr-2" /> Register Asset
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="bg-card-bg border-border-subtle rounded-[2rem] shadow-sm">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <FilterInput label="Plate Number" val={filters.plate_number} onChange={v => setFilters({...filters, plate_number: v})} />
          <FilterInput label="Model" val={filters.model} onChange={v => setFilters({...filters, model: v})} />
          <div className="space-y-1">
            <label className="text-[10px] font-black text-text-muted uppercase ml-1">Type</label>
            <select className="w-full bg-dashboard-bg border border-border-subtle rounded-2xl px-4 py-2.5 text-xs text-text-main outline-none"
              value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="">All Categories</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="container">Container</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-text-muted uppercase ml-1">Status</label>
            <select className="w-full bg-dashboard-bg border border-border-subtle rounded-2xl px-4 py-2.5 text-xs text-text-main outline-none"
              value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="busy">On Trip</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => loadVehicles(1)} className="flex-1 bg-primary text-black font-bold h-11 rounded-2xl">Filter</Button>
            <button onClick={() => {setFilters({plate_number:"", model:"", type:"", status:""}); loadVehicles(1);}} className="p-3 text-primary border border-border-subtle rounded-2xl hover:bg-primary/10 transition-all"><RotateCcw size={18}/></button>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="bg-card-bg border-border-subtle rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-dashboard-bg/50 border-b border-border-subtle">
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                <th className="py-5 px-8 text-left">Plate Information</th>
                <th className="py-5 px-8 text-left">Make & Model</th>
                <th className="py-5 px-8 text-left">Category</th>
                <th className="py-5 px-8 text-left">Status</th>
                <th className="py-5 px-8 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr><td colSpan="5" className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={48} /></td></tr>
              ) : vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-dashboard-bg/20 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="text-sm font-black text-primary font-mono tracking-tight uppercase">{v.plate_number}</div>
                    <div className="text-[9px] text-text-muted font-bold uppercase mt-1">{v.color || 'No Color Info'}</div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="text-[13px] font-bold text-text-main">{v.make}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase">{v.model} ({v.year})</div>
                  </td>
                  <td className="py-5 px-8 font-black text-[11px] text-text-main uppercase">{v.type}</td>
                  <td className="py-5 px-8">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase border",
                      v.status === 'available' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                      v.status === 'busy' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>{v.status}</span>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex justify-center gap-2">
                      <ActionBtn icon={<Eye size={14}/>} theme="primary" onClick={() => setViewModal({ open: true, id: v.id })} />
                      <ActionBtn icon={<Edit size={14}/>} theme="blue" onClick={() => setModal({ open: true, data: v })} />
                      <ActionBtn icon={<Trash2 size={14}/>} theme="red" onClick={() => handleDelete(v.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-6 border-t border-border-subtle flex justify-between items-center bg-dashboard-bg/10">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Fleet: {pagination.total}</span>
          <div className="flex gap-2">
            <Button disabled={pagination.page <= 1} onClick={() => loadVehicles(pagination.page - 1)} variant="outline" className="h-10 w-10 p-0 border-border-subtle rounded-xl"><ChevronLeft size={18}/></Button>
            <Button disabled={pagination.page >= pagination.pages} onClick={() => loadVehicles(pagination.page + 1)} variant="outline" className="h-10 w-10 p-0 border-border-subtle rounded-xl"><ChevronRight size={18}/></Button>
          </div>
        </div>
      </Card>

      <VehicleModal 
        isOpen={modal.open} 
        onClose={() => setModal({ open: false, data: null })} 
        editData={modal.data} 
        onSuccess={() => loadVehicles(pagination.page)} 
      />

      <VehicleDetailsModal 
        isOpen={viewModal.open} 
        onClose={() => setViewModal({ open: false, id: null })} 
        vehicleId={viewModal.id} 
      />
    </div>
  );
}

function FilterInput({ label, val, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-text-muted uppercase ml-1">{label}</label>
      <input className="w-full bg-dashboard-bg border border-border-subtle rounded-2xl px-4 py-2.5 text-xs text-text-main outline-none focus:border-primary"
        value={val} onChange={e => onChange(e.target.value)} placeholder={`Search ${label}...`} />
    </div>
  );
}

function ActionBtn({ icon, theme, onClick }) {
  const themes = {
    primary: "text-primary bg-primary/10 border-primary/20 hover:bg-primary hover:text-black",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500 hover:text-white",
    red: "text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-white"
  };
  return (
    <button onClick={onClick} className={cn("w-10 h-10 flex items-center justify-center border rounded-2xl transition-all shadow-sm", themes[theme])}>
      {icon}
    </button>
  );
} 