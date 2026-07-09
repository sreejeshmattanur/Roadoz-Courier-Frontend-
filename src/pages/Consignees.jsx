import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Download, Plus, X, RotateCcw,
  Mail, Phone, Loader2, ShieldAlert, Edit, Trash2 
} from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { downloadConsigneeExcel } from "../lib/downloadConsigneeExcel";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  createConsignee,
  fetchConsignees,
  updateConsignee,
  deleteConsignee, // Added deleteConsignee
} from "../redux/consigneeSlice";
import { swalSuccess, swalError, swalConfirm } from "../lib/swal";
import { usePermission } from "../hooks/usePermission";

export function Consignees() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { consignees: consigneePerms } = usePermission();
  
  // Destructuring permissions
  const { create: canCreate, view: canView, edit: canEdit, delete: canDelete } = consigneePerms;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsignee, setEditingConsignee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
  });

  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    email: "",
    page: 1,
  });

  const [selectedRows, setSelectedRows] = useState([]);

  const {
    consignees,
    loading,
    currentPage,
    totalPages,
    totalConsignees,
    limit,
  } = useSelector((state) => state.consignees);

  useEffect(() => {
    if (canView) {
      dispatch(fetchConsignees({ page: filters.page, limit: 10 }));
    }
  }, [dispatch, filters.page, canView]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    const search = filters.name || filters.mobile || filters.email || "";
    dispatch(fetchConsignees({ page: 1, limit: 10, ...(search && { search }) }));
  };

  const clearFilters = () => {
    setFilters({ name: "", mobile: "", email: "", page: 1 });
    dispatch(fetchConsignees({ page: 1, limit: 10 }));
  };

  const handleSaveConsignee = async () => {
    try {
      if (editingConsignee) {
        await dispatch(updateConsignee({ id: editingConsignee.id, data: formData })).unwrap();
        swalSuccess("Updated", "Consignee updated successfully.");
      } else {
        await dispatch(createConsignee(formData)).unwrap();
        swalSuccess("Created", "Consignee added to registry.");
      }
      setIsModalOpen(false);
      setEditingConsignee(null);
      resetForm();
      dispatch(fetchConsignees({ page: filters.page, limit: 10 }));
    } catch (error) {
      swalError("Error", error || "Action failed");
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", mobile: "", alternate_mobile: "", email: "", 
      address_line_1: "", address_line_2: "", pincode: "", city: "", state: "" 
    });
    setEditingConsignee(null);
  };

  const handleEdit = (consignee) => {
    setEditingConsignee(consignee);
    setFormData({
      name: consignee.name || "",
      mobile: consignee.mobile || "",
      alternate_mobile: consignee.alternate_mobile || "",
      email: consignee.email || "",
      address_line_1: consignee.address_line_1 || "",
      address_line_2: consignee.address_line_2 || "",
      pincode: consignee.pincode || "",
      city: consignee.city || "",
      state: consignee.state || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await swalConfirm("Delete Consignee?", "This action cannot be undone.");
    if (confirmed) {
      try {
        await dispatch(deleteConsignee(id)).unwrap();
        swalSuccess("Deleted", "Consignee removed from registry.");
        dispatch(fetchConsignees({ page: filters.page, limit: 10 }));
      } catch (error) {
        swalError("Error", error || "Delete failed");
      }
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === consignees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(consignees.map((c) => c.id));
    }
  };

  const handleExport = () => {
    const selectedData = consignees.filter((c) => selectedRows.includes(c.id));
    if (selectedData.length === 0) {
      swalError("Selection Required", "Please select rows to export.");
      return;
    }
    downloadConsigneeExcel(selectedData);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-text-main">Access Denied</h2>
        <p className="text-text-muted mt-2">You do not have permission to view the Consignee Registry.</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary text-black">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Consignee Registry</h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Consignee
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs">
            <Download size={16} className="mr-2" /> Export CSV
          </Button>

          {canCreate && (
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs">
              <Plus size={18} className="mr-2" /> Add Consignee
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-xs font-medium text-text-muted">Name</label><input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Name" className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-text-muted">Mobile</label><input type="text" name="mobile" value={filters.mobile} onChange={handleFilterChange} placeholder="Mobile" className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-text-muted">Email</label><input type="text" name="email" value={filters.email} onChange={handleFilterChange} placeholder="Email" className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none" /></div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSearch} className="flex-1 bg-primary text-black h-9 text-xs font-bold rounded-md">Search</Button>
              <button onClick={clearFilters} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><RotateCcw size={14} /> Clear</button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-dashboard-bg/60 border-b border-border-subtle">
                <tr className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-4 px-6 text-left">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={consignees.length > 0 && selectedRows.length === consignees.length} onChange={handleSelectAll} className="w-4 h-4 accent-primary" />
                      <span>ID</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left">Name</th>
                  <th className="py-4 px-6 text-left">Contact</th>
                  <th className="py-4 px-6 text-left">Location</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-primary" size={40} />
                      <p className="text-text-muted mt-2 text-sm">Loading registry...</p>
                    </td>
                  </tr>
                ) : (
                  consignees.map((c) => (
                    <tr key={c.id} className="hover:bg-dashboard-bg/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={selectedRows.includes(c.id)} onChange={() => handleSelectRow(c.id)} className="w-4 h-4 accent-primary" />
                          <span className="text-[13px] font-mono text-primary font-bold">#{c.id?.slice(0, 6)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[14px] font-bold text-text-main">{c.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5 text-[12px]">
                          <span className="text-text-main flex items-center gap-1.5"><Phone size={12} className="text-primary" /> {c.mobile}</span>
                          <span className="text-text-muted flex items-center gap-1.5"><Mail size={12} className="text-primary" /> {c.email || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[13px] text-text-main font-medium">{c.city || "-"}, {c.state || "-"}</span>
                        <p className="text-[11px] text-text-muted">{c.pincode}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={cn(
                          "text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider",
                          c.status === "active" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {c.status || "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(c)}
                              className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all duration-200"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {!canEdit && !canDelete && <span className="text-text-muted">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && consignees.length === 0 && (
                   <tr>
                   <td colSpan="6" className="py-20 text-center text-text-muted text-sm">
                     No consignees found in registry.
                   </td>
                 </tr>
                )}
              </tbody>
            </table>
          </div>
          {consignees.length > 0 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              totalEntries={totalConsignees} 
              limit={limit} 
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))} 
            />
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card-bg rounded-xl w-full max-w-2xl border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border-subtle">
                <h3 className="text-lg font-bold text-text-main">{editingConsignee ? "Edit Consignee" : "Add New Consignee"}</h3>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar bg-card-bg">
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">Mobile *</label><input type="text" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile No" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">Alternate Mobile</label><input type="text" name="alternate_mobile" value={formData.alternate_mobile} onChange={handleChange} placeholder="Alternate Mobile" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">Email</label><input type="text" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold uppercase text-text-muted">Address Line 1 *</label><input type="text" name="address_line_1" value={formData.address_line_1} onChange={handleChange} placeholder="Address Line 1" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold uppercase text-text-muted">Address Line 2</label><input type="text" name="address_line_2" value={formData.address_line_2} onChange={handleChange} placeholder="Address Line 2" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">Pincode *</label><input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">City</label><input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-text-muted">State</label><input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className="w-full bg-dashboard-bg border border-border-subtle rounded px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" /></div>
              </div>

              <div className="p-5 border-t border-border-subtle flex justify-end gap-3 bg-dashboard-bg/50">
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-2 text-sm font-bold text-text-muted hover:text-white transition-colors">Cancel</button>
                <Button onClick={handleSaveConsignee} disabled={loading} className="bg-primary text-black h-10 px-10 font-bold shadow-md transition-all">
                   {loading ? "Saving..." : "Save Consignee"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}