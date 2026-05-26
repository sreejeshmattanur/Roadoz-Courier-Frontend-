import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, Plus, X, RotateCcw, Edit, Trash2 } from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { downloadConsigneeExcel } from "../lib/downloadConsigneeExcel";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createConsignee,
  fetchConsignees,
  updateConsignee,
  deleteConsignee,
} from "../redux/consigneeSlice";

export function Consignees() {
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

  const dispatch = useDispatch();

  const { consignees, loading } = useSelector((state) => state.consignees);

  useEffect(() => {
    dispatch(
      fetchConsignees({
        page: filters.page,
        limit: 25,
      }),
    );
  }, [dispatch, filters.page]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSearch = () => {
    const search =
      filters.name || filters.mobile || filters.email || "";

    dispatch(
      fetchConsignees({
        page: filters.page,
        limit: 25,
        ...(search && { search }),
      }),
    );
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      mobile: "",
      email: "",
      page: 1,
    });

    dispatch(fetchConsignees({ page: 1, limit: 25 }));
  };

  const handleSaveConsignee = async () => {
    try {
      if (editingConsignee) {
        await dispatch(
          updateConsignee({
            id: editingConsignee.id,
            data: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createConsignee(formData)).unwrap();
      }

      setFormData({
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

      setEditingConsignee(null);

      setIsModalOpen(false);

      dispatch(fetchConsignees());
    } catch (error) {
      console.log(error);
    }
  };

  const toggleStatus = async (consignee) => {
    try {
      await dispatch(
        updateConsignee({
          id: consignee.id,
          data: {
            ...consignee,
            status: consignee.status === "active" ? "inactive" : "active",
          },
        }),
      ).unwrap();

      dispatch(
        fetchConsignees({
          page: filters.page,
          limit: 25,
        }),
      );
    } catch (error) {
      console.log(error);
    }
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
    try {
      await dispatch(deleteConsignee(id)).unwrap();
      dispatch(fetchConsignees());
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
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
      alert("Please select at least one consignee");
      return;
    }

    downloadConsigneeExcel(selectedData);
  };

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Consignee Registry
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span>
            Consignee
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs"
          >
            <Download size={16} className="mr-2" /> Export CSV
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg text-xs"
          >
            <Plus size={18} className="mr-2" /> Add Consignee
          </Button>
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-xs font-medium text-text-muted">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Name"
                className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-xs font-medium text-text-muted">
                Mobile No
              </label>

              <input
                type="text"
                name="mobile"
                value={filters.mobile}
                onChange={handleFilterChange}
                placeholder="Mobile No"
                className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-xs font-medium text-text-muted">
                Email
              </label>
              <input
                type="text"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="Email"
                className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-black h-9 px-8 text-xs font-bold rounded-md"
              >
                Search
              </Button>

              <button
                onClick={clearFilters}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline whitespace-nowrap"
              >
                <RotateCcw size={14} /> Clear Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-hidden overflow-y-visible border border-border-subtle">
            <table className="w-full border-collapse">
              <thead className="bg-dashboard-bg/60 border-b border-border-subtle">
                <tr className="text-text-muted text-[12px] font-bold uppercase">
                  <th className="py-3 px-4 text-left w-[10%]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          consignees.length > 0 &&
                          selectedRows.length === consignees.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />

                      <span>ID</span>
                    </div>
                  </th>

                  <th className="py-3 px-4 text-left w-[16%]">Name</th>

                  <th className="py-3 px-4 text-left w-[19%]">Contact</th>

                  <th className="py-3 px-4 text-left w-[24%]">Address</th>

                  <th className="py-3 px-4 text-left w-[12%]">Location</th>

                  <th className="py-3 px-4 text-left w-[8%]">Pin</th>

                  <th className="py-3 px-4 text-center w-[6%]">Status</th>

                  <th className="py-3 px-4 text-center w-[5%]">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle">
                {consignees.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-dashboard-bg/30 transition-colors"
                  >
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(c.id)}
                          onChange={() => handleSelectRow(c.id)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />

                        <span className="text-[14px] font-semibold text-text-main whitespace-nowrap">
                          #{c.id?.slice(0, 6)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="leading-[18px]">
                        <p className="text-[15px] font-semibold text-text-main">
                          {c.name}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="leading-[18px]">
                        <p className="text-[15px] font-semibold text-text-main">
                          {c.mobile}
                        </p>

                        <p className="text-[13px] text-text-muted break-all">
                          {c.email || "No Email"}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="text-[13px] text-text-muted leading-[20px]">
                        <p>{c.address_line_1 || "-"}</p>

                        {c.address_line_2 && <p>{c.address_line_2}</p>}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="leading-[20px]">
                        <p className="text-[15px] font-medium text-text-main">
                          {c.city || "-"}
                        </p>

                        <p className="text-[13px] text-text-muted">
                          {c.state || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <span className="text-[15px] font-medium text-text-main">
                        {c.pincode}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggleStatus(c)}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            c.status === "active"
                              ? "bg-green-500"
                              : "bg-dashboard-bg border border-border-subtle",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                              c.status === "active"
                                ? "translate-x-5"
                                : "translate-x-1",
                            )}
                          />
                        </button>

                        <span
                          className={cn(
                            "text-[10px] font-semibold",
                            c.status === "active"
                              ? "text-green-500"
                              : "text-text-muted",
                          )}
                        >
                          {c.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all duration-200"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card-bg rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border-subtle"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-subtle">
                <h3 className="text-lg font-bold text-text-main">
                  {editingConsignee ? "Edit Consignee" : "Add New Consignee"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingConsignee(null);
                  }}
                  className="p-2 hover:bg-dashboard-bg rounded-full transition-colors text-text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Mobile No *
                    </label>

                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="Mobile No"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Alternate Mobile
                    </label>

                    <input
                      type="text"
                      name="alternate_mobile"
                      value={formData.alternate_mobile}
                      onChange={handleChange}
                      placeholder="Alternate Mobile"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Email Address
                    </label>

                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Address Line 1 *
                    </label>

                    <input
                      type="text"
                      name="address_line_1"
                      value={formData.address_line_1}
                      onChange={handleChange}
                      placeholder="Address 1"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Address Line 2
                    </label>

                    <input
                      type="text"
                      name="address_line_2"
                      value={formData.address_line_2}
                      onChange={handleChange}
                      placeholder="Address 2"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Pincode *
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="status"
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    defaultChecked
                  />
                  <label
                    htmlFor="status"
                    className="text-sm font-bold text-text-main cursor-pointer"
                  >
                    Active Consignee
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-border-subtle bg-dashboard-bg/50">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingConsignee(null);
                  }}
                  className="px-6 py-2 text-sm font-bold text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSaveConsignee}
                  disabled={loading}
                  className="bg-primary text-black h-10 px-10 font-bold shadow-md"
                >
                  Save Consignee
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
