import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, Eye, CheckCircle, XCircle, Phone, Mail,
  Filter, RotateCcw, MapPin, Loader2, ShieldAlert,
  User, Calendar, Lock
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { swalSuccess, swalError } from "../lib/swal";
import { cn } from "../lib/utils";
import Swal from "sweetalert2";

// Import Redux Actions from the new slice
import { 
  getApplications, 
  approveApplication, 
  rejectApplication 
} from "../redux/franchiseAppSlice";

import Pagination from "../components/ui/Pagination";
import { usePermission } from "../hooks/usePermission";

export function FranchiseApproval() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Permissions (assuming franchises permissions cover approvals)
  const { franchises } = usePermission();
  const { edit: canProcess, view: canView } = franchises;

  const { items, loading, pagination } = useSelector((state) => state.franchiseApp);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      ...customParams,
    };
    dispatch(getApplications(params));
  };

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilter = () => fetchData({ page: 1 });

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    fetchData({ page: 1, search: undefined, start_date: undefined, end_date: undefined });
  };

  /* =========================
     Action: APPROVE
     ========================= */
  const handleApprove = async (id) => {
    const { value: password } = await Swal.fire({
      title: "Approve Franchise",
      text: "Please set a login password for this new franchise user.",
      input: "password",
      inputPlaceholder: "Enter password",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#D4AF37", // Matching Golden Theme
      confirmButtonText: "Approve & Create Account",
      inputAttributes: {
        minlength: "6",
        autocapitalize: "off",
        autocorrect: "off"
      },
      inputValidator: (value) => {
        if (!value) return "You need to write a password!";
        if (value.length < 6) return "Password must be at least 6 characters.";
      }
    });

    if (password) {
      try {
        await dispatch(approveApplication({ application_id: id, password })).unwrap();
        swalSuccess("Approved!", "Franchise user created successfully.");
        fetchData();
      } catch (err) {
        swalError("Approval Failed", err);
      }
    }
  };

  /* =========================
     Action: REJECT
     ========================= */
  const handleReject = async (id) => {
    const { value: remarks } = await Swal.fire({
      title: "Reject Application",
      text: "Please provide a reason for rejection.",
      input: "textarea",
      inputPlaceholder: "Insufficient documents, location not serviceable, etc.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Confirm Rejection",
      inputValidator: (value) => {
        if (!value) return "Please enter rejection remarks.";
      }
    });

    if (remarks) {
      try {
        await dispatch(rejectApplication({ 
          id, 
          data: { status: "rejected", admin_remarks: remarks } 
        })).unwrap();
        swalSuccess("Rejected", "The application has been declined.");
        fetchData();
      } catch (err) {
        swalError("Action Failed", err);
      }
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

  const filterInputClass = "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
          Franchise Approvals
        </h1>
        <p className="text-xs md:text-sm text-primary mt-1 font-medium">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <span className="text-text-muted mx-2">&gt;&gt;</span> Application Management
        </p>
      </div>

      {/* Filter Card */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Search Applicant</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Name or Email..."
                  className={cn(filterInputClass, "pl-10")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Submitted From</label>
              <input type="date" className={filterInputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Submitted To</label>
              <input type="date" className={filterInputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleFilter} className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs">
                <Filter size={14} className="mr-2" /> Filter Applications
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
          <p className="text-text-muted text-sm">Fetching pending applications...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase border-b border-border-subtle">
                      <th className="px-6 py-4">Applicant</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Proposed Location</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Process Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {sortedItems.map((app) => (
                      <tr key={app.id} className="hover:bg-dashboard-bg/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-text-main">{app.full_name}</div>
                          <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5 uppercase">
                            <Calendar size={10} /> {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Mail size={12} className="text-primary/70" /> {app.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Phone size={12} className="text-primary/70" /> {app.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-text-main uppercase">
                             <MapPin size={12} className="text-primary" /> {app.proposed_location}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono ml-4">PIN: {app.pincode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] px-2 py-1 rounded font-bold uppercase",
                            app.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            {canProcess && app.status === "pending" && (
                              <>
                                <button 
                                  onClick={() => handleApprove(app.id)} 
                                  className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
                                  title="Approve & Create User"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => handleReject(app.id)} 
                                  className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                                  title="Reject Application"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            <button className="w-9 h-9 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all">
                              <Eye size={18} />
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {sortedItems.map((app) => (
              <Card key={app.id} className="bg-card-bg border-border-subtle overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {app.status}
                    </div>
                    <div className="text-[10px] text-text-muted font-mono">
                      {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dashboard-bg flex items-center justify-center text-primary border border-border-subtle">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{app.full_name}</p>
                        <p className="text-[10px] text-text-muted">{app.email}</p>
                      </div>
                    </div>

                    <div className="bg-dashboard-bg/50 p-2 rounded-lg space-y-1">
                       <div className="flex items-center gap-2 text-xs text-text-main">
                          <MapPin size={12} className="text-primary" /> {app.proposed_location}
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <div className="flex gap-2">
                        {canProcess && app.status === "pending" && (
                          <>
                            <Button onClick={() => handleApprove(app.id)} size="sm" className="bg-green-500 hover:bg-green-600 text-white h-8 px-2">
                              <CheckCircle size={14} className="mr-1"/> Approve
                            </Button>
                            <Button onClick={() => handleReject(app.id)} size="sm" variant="destructive" className="h-8 px-2">
                              <XCircle size={14} className="mr-1"/> Reject
                            </Button>
                          </>
                        )}
                      </div>
                      <button className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-lg"><Eye size={16} /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Pagination 
              currentPage={pagination.page} 
              totalPages={pagination.pages} 
              totalEntries={pagination.total} 
              onPageChange={handlePageChange} 
            />
          </div>
        </>
      )}
    </div>
  );
}