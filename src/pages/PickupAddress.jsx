import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Plus,
  X,
  MapPin,
  RotateCcw,
  Filter,
  Download,
  Edit,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchPickupAddresses,
  createPickupAddress,
  updatePickupAddress,
  deletePickupAddress,
} from "../redux/orderSlice";
import { usePermission } from "../hooks/usePermission";

export function PickupAddress() {
  const { pickupAddresses: pickupPerms } = usePermission();
  const dispatch = useDispatch();

  // Redux State
  const { pickupAddresses, loading, totalPickupAddresses } = useSelector(
    (state) => state.orders
  );

  // Local State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nickname: "",
    contact_name: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
    active: true,
    is_primary: false,
  });

  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    contact_name: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Fetch Function
  const loadAddresses = useCallback(() => {
    dispatch(
      fetchPickupAddresses({
        page: currentPage,
        limit: itemsPerPage,
        // Pass filters to API for server-side searching
        contact_name: filters.contact_name || undefined,
        city: filters.city || undefined,
        pincode: filters.pincode || undefined,
      })
    );
  }, [dispatch, currentPage, filters.contact_name, filters.city, filters.pincode]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nickname.trim()) newErrors.nickname = "Required";
    if (!formData.contact_name.trim()) newErrors.contact_name = "Required";
    if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Invalid phone";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.address_line_1.trim()) newErrors.address_line_1 = "Required";
    if (formData.pincode.length !== 6) newErrors.pincode = "Must be 6 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFilter = () => {
    setCurrentPage(1); // Reset to page 1 when filtering
    loadAddresses();
  };

  const clearFilters = () => {
    setFilters({ contact_name: "", address: "", city: "", pincode: "" });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (pickupAddresses.length === 0) return;
    const headers = ["Nickname,Contact,Phone,Email,City,Pincode,Status"];
    const rows = pickupAddresses.map(addr => 
      `${addr.nickname},${addr.contact_name},${addr.phone},${addr.email},${addr.city},${addr.pincode},${addr.active}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "pickup_addresses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingAddress) {
        await dispatch(updatePickupAddress({ id: editingAddress.id, data: formData })).unwrap();
        toast.success("Updated successfully");
      } else {
        await dispatch(createPickupAddress(formData)).unwrap();
        toast.success("Added successfully");
      }
      setIsModalOpen(false);
      setEditingAddress(null);
      loadAddresses();
    } catch (error) {
      toast.error(error || "Something went wrong");
    }
  };

  const toggleStatus = async (addr) => {
    try {
      await dispatch(updatePickupAddress({ id: addr.id, data: { ...addr, active: !addr.active } })).unwrap();
      loadAddresses();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (addr) => {
    setEditingAddress(addr);
    setFormData({ ...addr });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await dispatch(deletePickupAddress(id)).unwrap();
        toast.success("Deleted successfully");
        loadAddresses();
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Pickup Address</h1>
          <p className="text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline">Dashboard</Link>
            <span className="text-text-muted mx-1">&gt;&gt;</span> Pickup Address
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} className="h-10 text-xs">
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          {pickupPerms.create && (
            <Button onClick={() => { setEditingAddress(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs">
              <Plus size={18} className="mr-2" /> New Pickup Address
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card-bg border-border-subtle shadow-sm rounded-2xl">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Contact Name</label>
              <input
                type="text"
                placeholder="Search..."
                value={filters.contact_name}
                onChange={(e) => setFilters(prev => ({ ...prev, contact_name: e.target.value }))}
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:border-primary outline-none w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">City</label>
              <input
                type="text"
                placeholder="Search city..."
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:border-primary outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-2 lg:col-span-1">
              <Button onClick={handleFilter} className="flex-1 bg-primary text-black h-9 text-xs">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 border border-border-subtle">
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dashboard-bg/50 border-b border-border-subtle">
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase">ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase">Location</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-text-muted">Loading data...</td></tr>
                ) : pickupAddresses.map((addr) => (
                  <tr key={addr.id} className="hover:bg-dashboard-bg/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-text-main">{addr.id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold">{addr.nickname}</div>
                      <div className="text-text-muted">{addr.contact_name} | {addr.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {addr.address_line_1}, {addr.city}, {addr.pincode}
                    </td>
                    <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(addr)}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            addr.active ? "bg-green-500" : "bg-gray-600"
                          )}
                        >
                          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform", addr.active ? "translate-x-5.5" : "translate-x-1")} />
                        </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(addr)} className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary hover:text-black">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(addr.id)} className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Integration */}
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(totalPickupAddresses / itemsPerPage)}
            totalEntries={totalPickupAddresses}
            limit={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-4xl bg-card-bg rounded-xl shadow-2xl border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-dashboard-bg/20">
                <h3 className="text-lg font-bold">{editingAddress ? "Edit" : "Add"} Pickup Address</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main"><X size={24} /></button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nickname */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase">Nickname*</label>
                    <input name="nickname" value={formData.nickname} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.nickname && "border-red-500")} />
                  </div>
                  {/* Contact Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase">Contact Name*</label>
                    <input name="contact_name" value={formData.contact_name} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.contact_name && "border-red-500")} />
                  </div>
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase">Phone*</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.phone && "border-red-500")} />
                  </div>
                   {/* Email */}
                   <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase">Email*</label>
                    <input name="email" value={formData.email} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.email && "border-red-500")} />
                  </div>
                  {/* Address 1 */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Address Line 1*</label>
                    <input name="address_line_1" value={formData.address_line_1} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.address_line_1 && "border-red-500")} />
                  </div>
                  {/* Pincode */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase">Pincode*</label>
                    <input name="pincode" value={formData.pincode} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.pincode && "border-red-500")} />
                  </div>
                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase">City*</label>
                    <input name="city" value={formData.city} onChange={handleChange} className={cn("w-full bg-dashboard-bg border rounded-md px-4 py-2 text-sm text-text-main outline-none focus:border-primary", errors.city && "border-red-500")} />
                  </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border-subtle bg-dashboard-bg/50">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-black h-11 px-12 font-bold">
                  {loading ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}