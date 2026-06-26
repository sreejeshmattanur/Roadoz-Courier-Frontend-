import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, Search, Edit, Trash2, MapPin, Phone, Mail, 
  ToggleRight, ToggleLeft, Filter, RotateCcw, 
  Download, Loader2, X, Lock, Shield, Settings, AlertCircle, ShieldAlert
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { swalConfirmDelete, swalSuccess, swalError } from "../../lib/swal";
import { cn } from "../../lib/utils";
import { getUsers, addUser, editUser, removeUser } from "../../redux/userSlice";
import Pagination from "../../components/ui/Pagination";
import { usePermission } from "../../hooks/usePermission";

export function Users() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Permission Logic
  const { users: userPerms } = usePermission();
  const { create: canCreate, edit: canEdit, delete: canDelete, view: canView } = userPerms;

  const { items, loading, pagination } = useSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", pincode: "", is_active: true
  });

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [items]);

  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  const fetchData = (customParams = {}) => {
    const params = {
      page: customParams.page || pagination.page || 1,
      limit: 10,
      search: searchTerm || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      sort: 'created_at',
      order: 'desc',
      ...customParams
    };
    dispatch(getUsers(params));
  };

  const validateForm = () => {
    let errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,14}$/;

    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.email) errors.email = "Email address is required";
    else if (!emailRegex.test(formData.email)) errors.email = "Invalid email format";

    if (!formData.phone) errors.phone = "Phone number is required";
    else if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) errors.phone = "Invalid phone format (10-14 digits)";

    if (!editingUser && !formData.password) {
      errors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (user = null) => {
    // Check permission before opening
    if (user && !canEdit) return;
    if (!user && !canCreate) return;

    setFormErrors({});
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name, email: user.email, phone: user.phone,
        pincode: user.pincode || "", is_active: user.is_active, password: "" 
      });
    } else {
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", phone: "", pincode: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        toast.error("Please correct the errors in the form");
        return;
    }

    const toastId = toast.loading(editingUser ? "Updating user..." : "Creating user...");

    try {
      if (editingUser) {
        if (!canEdit) throw new Error("Permission Denied");
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await dispatch(editUser({ id: editingUser.id, data: updateData })).unwrap();
        toast.success("User updated successfully", { id: toastId });
      } else {
        if (!canCreate) throw new Error("Permission Denied");
        await dispatch(addUser(formData)).unwrap();
        toast.success("User created successfully", { id: toastId });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || err || "Operation failed", { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    const res = await swalConfirmDelete("Delete User?", "Permanent revocation of access.");
    if (res.isConfirmed) {
      try {
        await dispatch(removeUser(id)).unwrap();
        swalSuccess("Deleted", "User removed.");
      } catch (err) { swalError("Error", err || "Failed to delete."); }
    }
  };

  const toggleStatus = async (user) => {
    if (!canEdit) return;
    try {
      await dispatch(editUser({ id: user.id, data: { is_active: !user.is_active } })).unwrap();
      toast.success(`User is now ${!user.is_active ? 'Active' : 'Inactive'}`);
      fetchData();
    } catch (err) { toast.error("Status update failed"); }
  };

  const exportToCSV = () => {
    if (sortedItems.length === 0) return;
    const headers = ["Name,Email,Phone,Pincode,Role,Status,Joined"];
    const rows = sortedItems.map(u => [
      u.name, u.email, u.phone, u.pincode || "N/A", u.role?.name || "User",
      u.is_active ? "Active" : "Inactive", new Date(u.created_at).toLocaleDateString()
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `users_export.csv`);
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm(""); setStartDate(""); setEndDate("");
    fetchData({ page: 1, search: undefined, start_date: undefined, end_date: undefined });
  };

  // UI GUARD: If the user doesn't have users:view, show Access Denied
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-text-main">Access Denied</h2>
        <p className="text-text-muted mt-2">You do not have permission to view User Management.</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary text-black">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const filterInputClass = "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";
  const errorInputClass = "border-red-500 focus:border-red-500 bg-red-500/5";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">User Management</h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Admin Settings
            <span className="text-text-muted mx-2">&gt;&gt;</span> Users
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={exportToCSV} className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs">
                <Download size={16} className="mr-2" /> Export CSV
            </Button>
            {canCreate && (
              <Button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs">
                <Plus size={18} className="mr-2" /> Add New User
              </Button>
            )}
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Search User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input type="text" placeholder="Name, email, phone..." className={cn(filterInputClass, "pl-10")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData({ page: 1 })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Created From</label>
              <input type="date" className={filterInputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Created To</label>
              <input type="date" className={filterInputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => fetchData({ page: 1 })} className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs"><Filter size={14} className="mr-2" /> Filter</Button>
                <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-text-muted border border-border-subtle"><RotateCcw size={16} /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4">User Profile</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Zip/Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sortedItems.map(user => (
                  <tr key={user.id} className="hover:bg-dashboard-bg/20 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs uppercase">{user.name?.charAt(0)}</div>
                            <div>
                                <p className="font-bold text-sm text-text-main">{user.name}</p>
                                <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase"><Shield size={10}/> {user.role?.name || "User"}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                       <div className="flex items-center gap-1.5 text-[11px] text-text-muted"><Mail size={12}/> {user.email}</div>
                       <div className="flex items-center gap-1.5 text-[11px] text-text-muted"><Phone size={12}/> {user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1 text-xs font-bold text-text-main uppercase"><MapPin size={12} className="text-primary"/> {user.pincode || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                       {/* Toggle status only if canEdit is true */}
                       {canEdit ? (
                         <button onClick={() => toggleStatus(user)}>{user.is_active ? <ToggleRight className="text-green-500" size={28} /> : <ToggleLeft className="text-text-muted/50" size={28} />}</button>
                       ) : (
                         <span className={cn("text-[10px] px-2 py-1 rounded font-bold", user.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                           {user.is_active ? "ACTIVE" : "INACTIVE"}
                         </span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex justify-center items-center gap-2">
                          {/* Edit icon only if canEdit is true */}
                          {canEdit && (
                            <button onClick={() => handleOpenModal(user)} className="p-1.5 text-primary bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary hover:text-black" title="Edit User"><Edit size={16}/></button>
                          )}
                          {/* Delete icon only if canDelete is true */}
                          {canDelete && (
                            <button onClick={() => handleDelete(user.id)} className="p-1.5 text-red-500 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white" title="Remove User"><Trash2 size={16}/></button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pagination.page} totalPages={pagination.pages} totalEntries={pagination.total} limit={pagination.limit} onPageChange={(p) => fetchData({ page: p })} />
        </Card>
      )}

      {/* User Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card-bg border border-border-subtle rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
                <h3 className="font-bold text-text-main flex items-center gap-2 uppercase tracking-tight"><Settings className="text-primary" size={20} /> {editingUser ? "Update User Profile" : "Create User Account"}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-text-muted hover:text-primary transition-colors"/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Full Name *</label>
                  <input className={cn(filterInputClass, formErrors.name && errorInputClass)} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="User's Full Name" />
                  {formErrors.name && <p className="text-[9px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> {formErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Email Address *</label>
                  <input className={cn(filterInputClass, formErrors.email && errorInputClass)} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@roadoz.com" />
                  {formErrors.email && <p className="text-[9px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> {formErrors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Phone Number *</label>
                  <input className={cn(filterInputClass, formErrors.phone && errorInputClass)} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." />
                  {formErrors.phone && <p className="text-[9px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> {formErrors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Pincode</label>
                  <input className={cn(filterInputClass, formErrors.pincode && errorInputClass)} value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="682001" />
                  {formErrors.pincode && <p className="text-[9px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> {formErrors.pincode}</p>}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Password {editingUser && "(Empty to keep current)"}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input type="password" className={cn(filterInputClass, "pl-9", formErrors.password && errorInputClass)} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  {formErrors.password && <p className="text-[9px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={10}/> {formErrors.password}</p>}
                </div>
                
                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-border-subtle mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-xs font-bold text-text-muted uppercase">Cancel</button>
                  <Button type="submit" className="bg-primary text-black font-bold px-10 h-11 rounded-xl shadow-lg">
                    {editingUser ? "Update Account" : "Create Account"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}