import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  ToggleRight,
  ToggleLeft,
  Calendar,
  Filter,
  RotateCcw,
  Download,
  User,
  Loader2,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { swalConfirmDelete, swalSuccess, swalError } from "../lib/swal";
import FranchiseDetailsModal from "../components/common/FranchiseDetailsModal";
import { cn } from "../lib/utils";
import {
  getFranchises,
  deleteFranchise,
  toggleFranchiseStatus,
} from "../redux/franchiseSlice";
import Pagination from "../components/ui/Pagination";

export function Franchise() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, loading, pagination } = useSelector(
    (state) => state.franchise,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 1. Client-side sorting as a secondary safety measure (Latest First)
  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [items]);

  // const sortedItems = [...(items || [])].sort((a, b) => {
  //   return new Date(b.created_at) - new Date(a.created_at);
  // });

  // useEffect(() => {
  //   fetchData();
  // }, [dispatch]);

  useEffect(() => {
    if (!items || items.length === 0) {
      fetchData();
    }
  }, []); // no dependency

  const fetchData = (customParams = {}) => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      // 2. Explicitly requesting the backend to sort by creation date
      sort: "created_at",
      order: "desc",
      ...customParams,
    };
    dispatch(getFranchises(params));
  };

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilter = () => {
    fetchData({ page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    dispatch(
      getFranchises({ page: 1, limit: 10, sort: "created_at", order: "desc" }),
    );
  };

  const handleDelete = async (id) => {
    const res = await swalConfirmDelete(
      "Remove Franchise?",
      "All records will be permanently deleted.",
    );
    if (res.isConfirmed) {
      try {
        await dispatch(deleteFranchise(id)).unwrap();
        swalSuccess("Deleted", "Franchise removed successfully.");
      } catch (err) {
        swalError("Error", err || "Failed to delete record.");
      }
    }
  };

  const handleToggleStatus = async (franchise) => {
    try {
      await dispatch(
        toggleFranchiseStatus({
          id: franchise.id,
          data: { is_active: !franchise.is_active },
        }),
      ).unwrap();
    } catch (err) {
      swalError("Error", "Failed to update status.");
    }
  };

  const exportToCSV = () => {
    if (sortedItems.length === 0) return;

    const headers = ["Code,Name,Email,Mobile,Location,Status,Joined Date"];
    const rows = sortedItems.map((f) =>
      [
        f.franchise_code,
        f.full_name,
        f.email_id,
        f.mobile_number,
        f.proposed_location,
        f.is_active ? "Active" : "Inactive",
        new Date(f.created_at).toLocaleDateString(),
      ].join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `franchise_registry_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterInputClass =
    "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Franchise Registry
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Registry
            Management
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs"
          >
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          <Button
            onClick={() => navigate("/dashboard/franchise/add")}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg transition-all text-xs"
          >
            <Plus size={18} className="mr-2" /> New Application
          </Button>
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Search Record
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Code or Name..."
                  className={cn(filterInputClass, "pl-10")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Starting Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={14}
                />
                <input
                  type="date"
                  className={cn(filterInputClass, "pl-9")}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Ending Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={14}
                />
                <input
                  type="date"
                  className={cn(filterInputClass, "pl-9")}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleFilter}
                className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs"
              >
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-9 px-3 text-text-muted border border-border-subtle"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-muted text-sm animate-pulse">
            Loading registry data...
          </p>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <Card className="hidden md:block bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-4">Unique Code</th>
                      <th className="px-6 py-4">Applicant</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {sortedItems.map((f) => (
                      <tr
                        key={`${f.id}-${f.updated_at}`}
                        className="hover:bg-dashboard-bg/20 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-primary text-xs">
                            {f.franchise_code}
                          </div>
                          <div className="text-[9px] text-text-muted mt-0.5">
                            {new Date(f.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-text-main">
                          {f.full_name}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Mail size={12} className="text-primary/70" />{" "}
                            {f.email_id}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Phone size={12} className="text-primary/70" />{" "}
                            {f.mobile_number}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs font-bold text-text-main uppercase">
                            <MapPin size={12} className="text-primary" />{" "}
                            {f.proposed_location}
                          </div>
                          <div className="text-[10px] text-text-muted ml-4 font-mono">
                            PIN Covered: {f.pincode?.split(",")[0]}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggleStatus(f)}>
                            {f.is_active ? (
                              <ToggleRight
                                className="text-green-500"
                                size={28}
                              />
                            ) : (
                              <ToggleLeft
                                className="text-text-muted/50"
                                size={28}
                              />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFranchise(f);
                                setIsDetailsOpen(true);
                              }}
                              className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/dashboard/franchise/edit/${f.id}`)
                              }
                              className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalEntries={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {sortedItems.map((f) => (
              <Card
                key={`${f.id}-${f.updated_at}`}
                className="bg-card-bg border-border-subtle overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-mono font-bold">
                      {f.franchise_code}
                    </div>
                    <button onClick={() => handleToggleStatus(f)}>
                      {f.is_active ? (
                        <ToggleRight className="text-green-500" size={28} />
                      ) : (
                        <ToggleLeft className="text-text-muted/50" size={28} />
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-dashboard-bg flex items-center justify-center text-primary border border-border-subtle">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">
                          {f.full_name}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">
                          {f.proposed_location}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 py-3 border-y border-border-subtle/50">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Phone size={12} className="text-primary" />
                        <span className="text-[11px]">{f.mobile_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-muted">
                        <Mail size={12} className="text-primary" />
                        <span className="text-[11px] truncate">
                          {f.email_id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-muted uppercase font-bold">
                          Submitted On
                        </span>
                        <span className="text-[11px] font-mono text-text-main">
                          {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedFranchise(f);
                            setIsDetailsOpen(true);
                          }}
                          className="p-2 bg-dashboard-bg border border-border-subtle text-primary rounded-lg"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/dashboard/franchise/edit/${f.id}`)
                          }
                          className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Pagination moved outside the map loop */}
            {sortedItems.length > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalEntries={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </>
      )}

      {!loading && sortedItems.length === 0 && (
        <div className="py-20 text-center space-y-3 bg-card-bg rounded-2xl border border-dashed border-border-subtle">
          <div className="inline-flex p-4 rounded-full bg-dashboard-bg text-text-muted">
            <Search size={32} />
          </div>
          <p className="text-text-muted font-bold text-sm uppercase tracking-widest">
            No matching records found
          </p>
          <Button
            onClick={clearFilters}
            variant="link"
            className="text-primary text-xs"
          >
            Clear all filters
          </Button>
        </div>
      )}

      <FranchiseDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        data={selectedFranchise}
      />
    </div>
  );
}
