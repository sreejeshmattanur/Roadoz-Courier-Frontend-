import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus, Search, Eye, Edit, Trash2, Phone, Mail,
  ToggleRight, ToggleLeft, Filter, RotateCcw,
  Download, User, Loader2, ShieldAlert, CheckSquare, Square, CheckCircle2
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
import { usePermission } from "../hooks/usePermission";

export function Franchise() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { franchises } = usePermission();
  const { create: canCreate, edit: canEdit, delete: canDelete, view: canView } = franchises;

  const { items, loading, pagination } = useSelector((state) => state.franchise);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // --- SELECTION STATE ---
  // We keep IDs here. Because we don't reset on page change, selections persist.
  const [selectedIds, setSelectedIds] = useState([]);

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
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
      search: searchTerm || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      sort: "created_at",
      order: "desc",
      ...customParams,
    };
    dispatch(getFranchises(params));
  };

  // --- SELECTION HANDLERS ---
  const isAllPageSelected = sortedItems.length > 0 && sortedItems.every(item => selectedIds.includes(item.id));

  const handleSelectPage = () => {
    if (isAllPageSelected) {
      // Unselect only the items on the current page
      const currentPageIds = sortedItems.map(i => i.id);
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Add current page items to selection, avoiding duplicates
      const newIds = sortedItems.map(i => i.id).filter(id => !selectedIds.includes(id));
      setSelectedIds(prev => [...prev, ...newIds]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => setSelectedIds([]);

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilter = () => {
    handleClearSelection(); // Clear selection when filters change to avoid data mismatch
    fetchData({ page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    handleClearSelection();
    dispatch(getFranchises({ page: 1, limit: 10, sort: "created_at", order: "desc" }));
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    const res = await swalConfirmDelete("Remove Franchise?", "This action cannot be undone.");
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
    if (!canEdit) return;
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

  // --- CSV EXPORT WITH COMPANY HEADING ---
  const exportToCSV = () => {
    // If specific IDs are selected, we filter our current items.
    // NOTE: If you need to export items from Page 1 while on Page 3, 
    // the Redux state 'items' usually only holds the current page.
    // This logic exports the intersection of selected IDs and current data,
    // or all current data if nothing is selected.
    
    const itemsToExport = selectedIds.length > 0 
      ? sortedItems.filter(f => selectedIds.includes(f.id)) 
      : sortedItems;

    if (itemsToExport.length === 0) {
        swalError("Export Error", "No records found to export.");
        return;
    }

    const companyHeading = "Roadoz PVT LTD courier and Cargo";
    const reportTitle = `Franchise Registry Report - Exported on ${new Date().toLocaleDateString()}`;
    const csvHeaders = ["Code,Name,Email,Mobile,Location,Status,Joined Date"];
    
    const rows = itemsToExport.map((f) =>
      [
        f.franchise_code, 
        f.full_name, 
        f.email_id, 
        f.mobile_number, 
        `"${f.proposed_location.replace(/"/g, '""')}"`, 
        f.is_active ? "Active" : "Inactive", 
        new Date(f.created_at).toLocaleDateString()
      ].join(",")
    );

    // Combine Everything
    const csvContent = 
      companyHeading + "\n" + 
      reportTitle + "\n\n" + 
      csvHeaders + "\n" + 
      rows.join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Roadoz_Franchise_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-text-main">Access Denied</h2>
        <p className="text-text-muted mt-2">You do not have permission to view the Franchise Registry.</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary text-black">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const filterInputClass = "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Roadoz PVT LTD courier and Cargo
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium italic">
            Franchise Registry Management
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={exportToCSV} 
            className={cn(
              "flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs transition-all",
              selectedIds.length > 0 && "border-primary text-primary bg-primary/10"
            )}
          >
            <Download size={16} className="mr-2" /> 
            {selectedIds.length > 0 ? `Download (${selectedIds.length})` : "Export CSV"}
          </Button>
          
          {canCreate && (
            <Button
              onClick={() => navigate("/dashboard/franchise/add")}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg transition-all text-xs"
            >
              <Plus size={18} className="mr-2" /> New Application
            </Button>
          )}
        </div>
      </div>

      {/* Selection Info Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>{selectedIds.length} franchises selected across all pages</span>
            </div>
            <button onClick={handleClearSelection} className="text-xs text-text-main hover:underline bg-card-bg px-3 py-1 rounded-full border border-border-subtle">
                Clear Selection
            </button>
        </div>
      )}

      {/* Filter Card */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Search Record</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
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
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Starting Date</label>
              <input type="date" className={filterInputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Ending Date</label>
              <input type="date" className={filterInputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleFilter} className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-text-muted border border-border-subtle">
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-muted text-sm">Loading registry...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-4 py-4 w-10">
                        <button onClick={handleSelectPage} className="text-primary transition-transform active:scale-90">
                          {isAllPageSelected ? (
                            <CheckSquare size={20} fill="currentColor" className="text-primary fill-primary/20" />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>
                      </th>
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
                        key={f.id} 
                        className={cn(
                          "hover:bg-dashboard-bg/20 transition-colors group",
                          selectedIds.includes(f.id) && "bg-primary/5 shadow-inner"
                        )}
                      >
                        <td className="px-4 py-4">
                          <button onClick={() => handleSelectItem(f.id)} className="text-text-muted hover:text-primary">
                            {selectedIds.includes(f.id) ? (
                              <CheckSquare size={20} className="text-primary" />
                            ) : (
                              <Square size={20} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-primary text-xs">{f.franchise_code}</div>
                          <div className="text-[9px] text-text-muted mt-0.5">{new Date(f.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-text-main">{f.full_name}</td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted"><Mail size={12} className="text-primary/70" /> {f.email_id}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted"><Phone size={12} className="text-primary/70" /> {f.mobile_number}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-xs text-text-main uppercase">{f.proposed_location}</td>
                        <td className="px-6 py-4">
                          {canEdit ? (
                            <button onClick={() => handleToggleStatus(f)}>
                              {f.is_active ? <ToggleRight className="text-green-500" size={28} /> : <ToggleLeft className="text-text-muted/50" size={28} />}
                            </button>
                          ) : (
                            <span className={cn("text-[10px] px-2 py-1 rounded font-bold", f.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                               {f.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            {canView && (
                              <button 
                                onClick={() => { setSelectedFranchise(f); setIsDetailsOpen(true); }} 
                                className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {canEdit && (
                              <button 
                                onClick={() => navigate(`/dashboard/franchise/edit/${f.id}`)} 
                                className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(f.id)} 
                                className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={pagination.page} totalPages={pagination.pages} totalEntries={pagination.total} limit={pagination.limit} onPageChange={handlePageChange} />
            </CardContent>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {sortedItems.map((f) => (
              <Card key={f.id} className={cn("bg-card-bg border-border-subtle overflow-hidden", selectedIds.includes(f.id) && "border-primary bg-primary/5")}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSelectItem(f.id)}>
                            {selectedIds.includes(f.id) ? <CheckSquare size={22} className="text-primary" /> : <Square size={22} className="text-text-muted" />}
                        </button>
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-mono font-bold">{f.franchise_code}</div>
                    </div>
                    {canEdit && (
                        <button onClick={() => handleToggleStatus(f)}>
                            {f.is_active ? <ToggleRight className="text-green-500" size={28} /> : <ToggleLeft className="text-text-muted/50" size={28} />}
                        </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-dashboard-bg flex items-center justify-center text-primary border border-border-subtle"><User size={14} /></div>
                      <div><p className="text-sm font-bold text-text-main">{f.full_name}</p></div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-text-muted uppercase font-bold">Joined On</span>
                        <span className="text-[11px] font-mono text-text-main">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        {canView && (
                          <button onClick={() => { setSelectedFranchise(f); setIsDetailsOpen(true); }} className="p-2 bg-dashboard-bg border border-border-subtle text-primary rounded-lg"><Eye size={16} /></button>
                        )}
                        {canEdit && (
                          <button onClick={() => navigate(`/dashboard/franchise/edit/${f.id}`)} className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-lg"><Edit size={16} /></button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(f.id)} className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sortedItems.length > 0 && (
              <Pagination currentPage={pagination.page} totalPages={pagination.pages} totalEntries={pagination.total} limit={pagination.limit} onPageChange={handlePageChange} />
            )}
          </div>
        </>
      )}

      {/* Details Modal */}
      <FranchiseDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} data={selectedFranchise} />
    </div>
  );
}
