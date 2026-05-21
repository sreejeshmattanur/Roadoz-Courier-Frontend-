import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Filter,
  RotateCcw,
  Loader2,
  Warehouse as WarehouseIcon,
  Plus,
  Download,
  X,
  Edit,
  Settings,
  Trash2,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

import { toast } from "react-hot-toast";

import { useDispatch, useSelector } from "react-redux";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

import { cn } from "../lib/utils";

import {
  fetchWarehouses,
  createWarehouse,
  fetchWarehouseByPincode,
  updateWarehouse,
  deleteWarehouse,
} from "../redux/warehouseSlice";

export function Warehouse() {
  const dispatch = useDispatch();

  const { items, loading } = useSelector((state) => state.warehouse);

  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

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
  });

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return [...items].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [items]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      dispatch(fetchWarehouses());
      return;
    }

    dispatch(fetchWarehouseByPincode(searchTerm));
  };

  const clearFilters = () => {
    setSearchTerm("");

    dispatch(fetchWarehouses());
  };

  const exportToCSV = () => {
    if (filteredItems.length === 0) return;

    const headers = [
      "Warehouse,Contact Person,Phone,Email,City,State,Pincode,Country",
    ];

    const rows = filteredItems.map((w) =>
      [
        w.nickname,
        w.contact_name,
        w.phone,
        w.email,
        w.city,
        w.state,
        w.pincode,
        w.country,
      ].join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);

    link.setAttribute("download", `warehouse_export.csv`);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const handleDelete = async (warehouseId) => {
    const toastId = toast.loading("Deleting warehouse...");

    try {
      await dispatch(deleteWarehouse(warehouseId)).unwrap();

      toast.success("Warehouse deleted successfully", { id: toastId });
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : "Failed to delete warehouse",
        { id: toastId },
      );
    }
  };

  const handleEdit = (warehouse) => {
    setIsEditMode(true);

    setSelectedWarehouseId(warehouse.id);

    setFormData({
      nickname: warehouse.nickname || "",
      contact_name: warehouse.contact_name || "",
      phone: warehouse.phone || "",
      email: warehouse.email || "",
      address_line_1: warehouse.address_line_1 || "",
      address_line_2: warehouse.address_line_2 || "",
      pincode: warehouse.pincode || "",
      city: warehouse.city || "",
      state: warehouse.state || "",
      country: warehouse.country || "India",
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const toastId = toast.loading(
      isEditMode ? "Updating warehouse..." : "Creating warehouse...",
    );

    try {
      if (isEditMode) {
        await dispatch(
          updateWarehouse({
            addressId: selectedWarehouseId,
            data: formData,
          }),
        ).unwrap();

        toast.success("Warehouse updated successfully", {
          id: toastId,
        });
      } else {
        await dispatch(createWarehouse(formData)).unwrap();

        toast.success("Warehouse created successfully", {
          id: toastId,
        });
      }

      setIsModalOpen(false);

      setIsEditMode(false);

      setSelectedWarehouseId(null);

      setFormData({
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
      });
    } catch (err) {
      console.log(err);

      let errorMessage = isEditMode
        ? "Failed to update warehouse"
        : "Failed to create warehouse";

      if (Array.isArray(err)) {
        errorMessage = err.map((e) => e.msg).join(", ");
      }

      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  const filterInputClass =
    "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Warehouse Registry
          </h1>

          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span>
            Warehouse
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs"
          >
            <Plus size={18} className="mr-2" />
            Add Warehouse
          </Button>
        </div>
      </div>
      {/* Filters */}
      <Card className="bg-card-bg border-border-subtle shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Search */}
            <div className="w-full max-w-[280px] space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Search By Pincode
              </label>

              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />

                <input
                  type="text"
                  placeholder="Search by pincode..."
                  className="w-full h-10 bg-transparent border border-border-subtle rounded-xl pl-10 pr-4 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-black h-10 px-8 rounded-xl text-xs font-bold"
              >
                <Filter size={14} className="mr-2" />
                Filter
              </Button>

              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-10 w-10 rounded-xl border border-border-subtle text-text-muted hover:bg-dashboard-bg p-0"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />

          <p className="text-text-muted text-sm animate-pulse">
            Loading warehouse data...
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <Card className="hidden md:block bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-4">Warehouse</th>

                      <th className="px-6 py-4">Contact Person</th>

                      <th className="px-6 py-4">Contact Info</th>

                      <th className="px-6 py-4">Location</th>

                      <th className="px-6 py-4">Address</th>

                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border-subtle">
                    {filteredItems.map((w) => (
                      <tr
                        key={w.id}
                        className="hover:bg-dashboard-bg/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <WarehouseIcon
                              size={16}
                              className="text-primary mt-1"
                            />

                            <div>
                              <p className="font-bold text-text-main text-sm">
                                {w.nickname}
                              </p>

                              <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(w.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-text-main">
                          {w.contact_name}
                        </td>

                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Mail size={12} className="text-primary/70" />

                            {w.email}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Phone size={12} className="text-primary/70" />

                            {w.phone}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs font-bold text-text-main uppercase">
                            <MapPin size={12} className="text-primary" />
                            {w.city}, {w.state}
                          </div>

                          <div className="text-[10px] text-text-muted ml-4">
                            {w.country} - {w.pincode}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-text-muted max-w-[220px]">
                          <div className="line-clamp-2">
                            {w.address_line_1}
                            {w.address_line_2 ? `, ${w.address_line_2}` : ""}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleEdit(w)}
                              variant="ghost"
                              className="h-9 w-9 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 p-0 transition-all"
                            >
                              <Edit size={16} />
                            </Button>

                            <Button
                              onClick={() => handleDelete(w.id)}
                              variant="ghost"
                              className="h-9 w-9 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-0 transition-all"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {filteredItems.map((w) => (
              <Card
                key={w.id}
                className="bg-card-bg border-border-subtle overflow-hidden"
              >
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <WarehouseIcon size={18} className="text-primary" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-text-main">
                        {w.nickname}
                      </p>

                      <p className="text-[11px] text-text-muted">
                        {w.contact_name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Mail size={13} className="text-primary" />

                      {w.email}
                    </div>

                    <div className="flex items-center gap-2 text-text-muted">
                      <Phone size={13} className="text-primary" />

                      {w.phone}
                    </div>

                    <div className="flex items-start gap-2 text-text-muted">
                      <MapPin size={13} className="text-primary mt-0.5" />

                      <div>
                        <div>
                          {w.city}, {w.state}
                        </div>

                        <div>
                          {w.country} - {w.pincode}
                        </div>
                      </div>
                    </div>

                    <div className="text-text-muted text-[11px] border-t border-border-subtle pt-3">
                      {w.address_line_1}
                      {w.address_line_2 ? `, ${w.address_line_2}` : ""}
                    </div>

                    <div className="pt-3 border-t border-border-subtle flex gap-2">
                      <Button
                        onClick={() => handleEdit(w)}
                        variant="ghost"
                        className="flex-1 h-10 rounded-xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold transition-all"
                      >
                        <Edit size={15} className="mr-2" />
                        Edit
                      </Button>

                      <Button
                        onClick={() => handleDelete(w.id)}
                        variant="ghost"
                        className="flex-1 h-10 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all"
                      >
                        <Trash2 size={15} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!loading && filteredItems.length === 0 && (
              <div className="py-20 text-center space-y-3 bg-card-bg rounded-2xl border border-dashed border-border-subtle">
                <div className="inline-flex p-4 rounded-full bg-dashboard-bg text-text-muted">
                  <Search size={32} />
                </div>

                <p className="text-text-muted font-bold text-sm uppercase tracking-widest">
                  No warehouses found
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card-bg border border-border-subtle rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
                <h3 className="font-bold text-text-main uppercase tracking-tight flex items-center gap-2">
                  <Settings size={18} className="text-primary" />

                  {isEditMode ? "Edit Warehouse" : "Add Warehouse"}
                </h3>

                <button
                  onClick={() => {
                    setIsModalOpen(false);

                    setIsEditMode(false);

                    setSelectedWarehouseId(null);
                  }}
                >
                  <X
                    size={24}
                    className="text-text-muted hover:text-primary transition-colors"
                  />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <input
                  className={filterInputClass}
                  placeholder="Warehouse Name"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nickname: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="Contact Person"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_name: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  className={cn(filterInputClass, "md:col-span-2")}
                  placeholder="Address Line 1"
                  value={formData.address_line_1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address_line_1: e.target.value,
                    })
                  }
                />

                <input
                  className={cn(filterInputClass, "md:col-span-2")}
                  placeholder="Address Line 2"
                  value={formData.address_line_2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address_line_2: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pincode: e.target.value,
                    })
                  }
                />

                <input
                  className={filterInputClass}
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      country: e.target.value,
                    })
                  }
                />

                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-border-subtle mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);

                      setIsEditMode(false);

                      setSelectedWarehouseId(null);
                    }}
                    className="px-6 py-2 text-xs font-bold text-text-muted uppercase"
                  >
                    Cancel
                  </button>

                  <Button
                    type="submit"
                    className="bg-primary text-black font-bold px-10 h-11 rounded-xl shadow-lg"
                  >
                    {isEditMode ? "Update Warehouse" : "Save Warehouse"}
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
