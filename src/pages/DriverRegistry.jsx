import React, { useEffect, useState } from "react";
import { 
  Users, Plus, Edit, Trash2, Loader2, Search, Eye, 
  RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle 
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  fetchDriversApi, deleteDriverApi, approveDriverApi, rejectDriverApi 
} from "../services/apiCalls";
import { toast } from "react-hot-toast";
import { swalConfirm, swalSuccess, swalError } from "../lib/swal";
import Swal from "sweetalert2"; // Used for rejection reason input
import DriverModal from "../components/modals/DriverModal";
import DriverDetailsModal from "../components/modals/DriverDetailsModal";

export default function DriverRegistry() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [modal, setModal] = useState({ open: false, data: null });
  const [viewModal, setViewModal] = useState({ open: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");

  const loadDrivers = async (page = 1) => {
    setLoading(true);
    try {
      const data = await fetchDriversApi({ page, limit: 10, search: searchTerm });
      setDrivers(data.items || []);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      toast.error("Failed to load registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrivers(); }, []);

  // --- NEW: Approval Logic ---
  const handleApprove = async (id) => {
    const confirmed = await swalConfirm("Approve Driver?", "This driver will be authorized to access the driver app.");
    if (confirmed) {
      try {
        await approveDriverApi(id);
        swalSuccess("Approved", "Driver has been verified successfully.");
        loadDrivers(pagination.page);
      } catch (err) {
        swalError("Error", "Approval failed.");
      }
    }
  };

  // --- NEW: Rejection Logic ---
  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Driver Application",
      input: "textarea",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "Enter specific reason (e.g. Invalid license, blurred photo)...",
      inputAttributes: { "aria-label": "Type your message here" },
      showCancelButton: true,
      confirmButtonText: "Confirm Rejection",
      confirmButtonColor: "#ef4444",
      background: "#1e1e1e",
      color: "#fff",
      inputValidator: (value) => {
        if (!value) return "You must provide a reason for rejection!";
      }
    });

    if (reason) {
      try {
        await rejectDriverApi(id, reason);
        swalSuccess("Rejected", "Application has been rejected.");
        loadDrivers(pagination.page);
      } catch (err) {
        swalError("Error", "Could not process rejection.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (await swalConfirm("Remove Driver?", "Action cannot be undone.")) {
      try {
        await deleteDriverApi(id);
        swalSuccess("Deleted", "Driver record removed.");
        loadDrivers(pagination.page);
      } catch (err) { swalError("Error", "Delete failed."); }
    }
  };

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-tighter">Personnel Registry</h1>
          <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase">Fleet Administration</p>
        </div>
        <Button onClick={() => setModal({ open: true, data: null })} className="bg-primary text-black font-bold h-12 px-6 rounded-2xl shadow-xl">
          <Plus size={18} className="mr-2" /> Onboard Driver
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="bg-card-bg border-border-subtle rounded-3xl">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              className="w-full bg-dashboard-bg border border-border-subtle rounded-2xl pl-12 pr-4 py-3 text-xs text-text-main outline-none focus:border-primary"
              placeholder="Search by Name, Phone, Email..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => loadDrivers(1)} className="bg-primary text-black font-bold px-8 rounded-2xl h-11">Filter</Button>
          <button onClick={() => { setSearchTerm(""); loadDrivers(1); }} className="p-3 text-primary border border-border-subtle rounded-2xl"><RotateCcw size={18}/></button>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-card-bg border-border-subtle rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-dashboard-bg/50 border-b border-border-subtle">
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                <th className="py-5 px-8 text-left">Identity</th>
                <th className="py-5 px-8 text-left">Contact</th>
                <th className="py-5 px-8 text-left">Verification</th>
                <th className="py-5 px-8 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr><td colSpan="4" className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={48} /></td></tr>
              ) : drivers.map(d => (
                <tr key={d.id} className="hover:bg-dashboard-bg/20 transition-colors">
                  <td className="py-5 px-8">
                    <div className="text-sm font-bold text-text-main capitalize">{d.first_name} {d.last_name}</div>
                    <div className="text-[9px] text-text-muted font-mono">{d.id.slice(0,8)}...</div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="text-[12px] text-text-main font-semibold">{d.email}</div>
                    <div className="text-[11px] text-text-muted">{d.phone}</div>
                  </td>
                  <td className="py-5 px-8">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${
                      d.onboarding_status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      d.onboarding_status === 'pending_verification' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {d.onboarding_status.replace('_',' ')}
                    </span>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex justify-center gap-2">
                      {/* VIEW DETAIL */}
                      <ActionBtn icon={<Eye size={14}/>} theme="primary" onClick={() => setViewModal({ open: true, id: d.id })} />
                      
                      {/* APPROVAL/REJECTION ACTIONS (Visible if Pending) */}
                      {d.onboarding_status === 'pending_verification' && (
                        <>
                          <ActionBtn icon={<CheckCircle size={14}/>} theme="green" onClick={() => handleApprove(d.id)} />
                          <ActionBtn icon={<XCircle size={14}/>} theme="red" onClick={() => handleReject(d.id)} />
                        </>
                      )}

                      {/* EDIT/DELETE */}
                      <ActionBtn icon={<Edit size={14}/>} theme="blue" onClick={() => setModal({ open: true, data: d })} />
                      <ActionBtn icon={<Trash2 size={14}/>} theme="red" onClick={() => handleDelete(d.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination logic here... */}
        <div className="p-6 border-t border-border-subtle flex justify-between items-center bg-dashboard-bg/10">
          <span className="text-[10px] font-black text-text-muted uppercase">Records: {pagination.total}</span>
          <div className="flex gap-2">
            <Button disabled={pagination.page <= 1} onClick={() => loadDrivers(pagination.page - 1)} variant="outline" className="h-10 w-10 border-border-subtle"><ChevronLeft size={18}/></Button>
            <Button disabled={pagination.page >= pagination.pages} onClick={() => loadDrivers(pagination.page + 1)} variant="outline" className="h-10 w-10 border-border-subtle"><ChevronRight size={18}/></Button>
          </div>
        </div>
      </Card>

      <DriverModal isOpen={modal.open} editData={modal.data} onClose={() => setModal({ open: false, data: null })} onSuccess={() => loadDrivers(pagination.page)} />
      <DriverDetailsModal isOpen={viewModal.open} driverId={viewModal.id} onClose={() => setViewModal({ open: false, id: null })} />
    </div>
  );
}

function ActionBtn({ icon, theme, onClick }) {
  const styles = {
    primary: "text-primary bg-primary/10 border-primary/20 hover:bg-primary hover:text-black",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500 hover:text-white",
    red: "text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-white",
    green: "text-green-500 bg-green-500/10 border-green-500/20 hover:bg-green-500 hover:text-white"
  };
  return (
    <button onClick={onClick} className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-sm ${styles[theme]}`}>
      {icon}
    </button>
  );
}