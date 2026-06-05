import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RotateCcw,
  Loader2,
  Star,
  Package,
  MessageSquare,
  Filter,
  User,
  Fingerprint,
} from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

export function Review() {
  const [reviewType, setReviewType] = useState("service");
  
  // Specific Filter States
  const [idSearch, setIdSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const loading = false;

  // SERVICE REVIEW DEMO DATA
  const serviceReviews = [
    {
      id: "SR001",
      user_id: "USR001",
      user_name: "Rahul Sharma",
      rating: 5,
      review: "Excellent courier service. Package arrived safely and on time.",
      created_at: "2026-05-14T07:15:25.060Z",
    },
    {
      id: "SR002",
      user_id: "USR002",
      user_name: "Arjun Nair",
      rating: 4,
      review: "Support team was very responsive and helpful.",
      created_at: "2026-05-13T09:25:10.060Z",
    },
    {
      id: "SR003",
      user_id: "USR003",
      user_name: "Aman Verma",
      rating: 3,
      review: "Delivery was slightly delayed but overall service was okay.",
      created_at: "2026-05-12T12:45:00.060Z",
    },
  ];

  // ORDER REVIEW DEMO DATA (Added user_name for consistent filtering)
  const [orderReviews, setOrderReviews] = useState([
    {
      id: "OR001",
      order_id: "ORD-2026-1001",
      auth_users_id: "USR100",
      user_name: "Priya Patel",
      review: "Package arrived in perfect condition.",
      rating: "5",
      status: "Pending",
    },
    {
      id: "OR002",
      order_id: "ORD-2026-1002",
      auth_users_id: "USR101",
      user_name: "Suresh Raina",
      review: "Delivery was delayed by one day.",
      rating: "3",
      status: "Approved",
    },
    {
      id: "OR003",
      order_id: "ORD-2026-1003",
      auth_users_id: "USR102",
      user_name: "Vikram Seth",
      review: "Very fast shipping and professional packaging.",
      rating: "5",
      status: "Pending",
    },
  ]);

  const selectedReviews = reviewType === "service" ? serviceReviews : orderReviews;

  /**
   * JAVASCRIPT CLIENT-SIDE FILTERING
   */
  const filteredReviews = useMemo(() => {
    return selectedReviews.filter((review) => {
      // 1. Filter by Review ID
      const matchesId = !idSearch || 
        review.id.toLowerCase().includes(idSearch.toLowerCase());

      // 2. Filter by User Name
      const matchesUser = !userSearch || 
        review.user_name.toLowerCase().includes(userSearch.toLowerCase());

      // 3. Filter by Order ID (Only applicable for order reviews)
      const matchesOrder = reviewType === "service" || !orderSearch || 
        (review.order_id && review.order_id.toLowerCase().includes(orderSearch.toLowerCase()));

      // 4. Filter by Status (Only applicable for order reviews)
      const matchesStatus = reviewType === "service" || statusFilter === "All" || 
        review.status === statusFilter;

      return matchesId && matchesUser && matchesOrder && matchesStatus;
    });
  }, [selectedReviews, idSearch, userSearch, orderSearch, statusFilter, reviewType]);

  const clearFilters = () => {
    setIdSearch("");
    setUserSearch("");
    setOrderSearch("");
    setStatusFilter("All");
  };

  const filterInputClass =
    "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
          Reviews Registry
        </h1>
        <p className="text-xs md:text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">Dashboard</Link>
          <span className="text-text-muted mx-2">&gt;&gt;</span> Reviews
        </p>
      </div>

      {/* REVIEW TYPE SELECTOR */}
      <div className="w-full rounded-2xl border border-border-subtle bg-card-bg px-6 py-5 flex flex-wrap gap-8 items-center shadow-sm">
        <div className="text-sm font-bold text-text-main uppercase tracking-wider">Review Type</div>
        <div className="flex items-center gap-6">
          <button onClick={() => setReviewType("service")} className="flex items-center gap-3 group">
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", reviewType === "service" ? "border-primary" : "border-text-muted group-hover:border-primary/50")}>
              {reviewType === "service" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <span className={cn("text-sm font-medium transition-colors", reviewType === "service" ? "text-white" : "text-text-muted")}>Service Review</span>
          </button>

          <button onClick={() => setReviewType("order")} className="flex items-center gap-3 group">
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", reviewType === "order" ? "border-primary" : "border-text-muted group-hover:border-primary/50")}>
              {reviewType === "order" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <span className={cn("text-sm font-medium transition-colors", reviewType === "order" ? "text-white" : "text-text-muted")}>Order Review</span>
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* SEARCH REVIEW ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Review ID</label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="Ex: SR001..."
                  className={cn(filterInputClass, "pl-10")}
                  value={idSearch}
                  onChange={(e) => setIdSearch(e.target.value)}
                />
              </div>
            </div>

            {/* SEARCH USER NAME */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">User Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="Search user..."
                  className={cn(filterInputClass, "pl-10")}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            {/* ORDER ID (Conditional) */}
            {reviewType === "order" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Order ID</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    type="text"
                    placeholder="ORD-2026..."
                    className={cn(filterInputClass, "pl-10")}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STATUS FILTER (Conditional) */}
            {reviewType === "order" && (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Status</label>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full h-9 rounded-lg border border-border-subtle bg-card-bg px-3 text-xs text-text-main flex items-center justify-between transition-all"
                >
                  <span>{statusFilter}</span>
                  <span className="text-text-muted text-[10px]">▼</span>
                </button>

                {isStatusOpen && (
                  <div className="absolute top-[60px] left-0 w-full rounded-lg border border-border-subtle bg-card-bg shadow-2xl overflow-hidden z-50">
                    <div className="p-1 space-y-1">
                      {["All", "Approved", "Pending"].map((status) => (
                        <button
                          key={status}
                          onClick={() => { setStatusFilter(status); setIsStatusOpen(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-xs transition-all",
                            statusFilter === status ? "bg-primary text-black font-bold" : "text-text-muted hover:bg-dashboard-bg"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs font-bold rounded-lg">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-9 px-3 text-text-muted border border-border-subtle hover:bg-dashboard-bg rounded-lg"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DATA TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-muted text-sm">Loading reviews...</p>
        </div>
      ) : (
        <Card className="bg-card-bg border-border-subtle overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-dashboard-bg/50 border-b border-border-subtle">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Review ID</th>
                    {reviewType === "order" && (
                       <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Order ID</th>
                    )}
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">User Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Rating</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Review Content</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      {reviewType === "service" ? "Date" : "Status"}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-subtle">
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-dashboard-bg/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-primary font-mono uppercase">{review.id}</td>
                      
                      {reviewType === "order" && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-main font-medium">
                            <Package size={14} className="text-primary/70" /> {review.order_id}
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-text-main">{review.user_name}</div>
                        <div className="text-[10px] text-text-muted font-mono">{review.user_id || review.auth_users_id}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md w-fit">
                          <Star size={12} className="text-primary fill-primary" />
                          <span className="text-xs font-bold text-primary">{review.rating}/5</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-xs lg:max-w-md">
                          <MessageSquare size={14} className="text-text-muted mt-0.5 shrink-0" />
                          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{review.review}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {reviewType === "service" ? (
                          <span className="text-[11px] text-text-muted font-mono">{new Date(review.created_at).toLocaleDateString()}</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setOrderReviews((prev) => prev.map((item) => item.id === review.id ? { ...item, status: item.status === "Approved" ? "Pending" : "Approved" } : item ));
                              }}
                              className={cn("relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner", review.status === "Approved" ? "bg-green-500/80" : "bg-yellow-500/80")}
                            >
                              <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-md", review.status === "Approved" ? "translate-x-4" : "translate-x-0")} />
                            </button>
                            <span className={cn("text-[9px] font-bold uppercase tracking-tighter", review.status === "Approved" ? "text-green-400" : "text-yellow-400")}>{review.status}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReviews.length === 0 && (
              <div className="py-20 text-center space-y-2">
                <div className="inline-flex p-4 bg-dashboard-bg rounded-full text-text-muted mb-2">
                  <Search size={24} />
                </div>
                <p className="text-text-muted font-bold text-sm uppercase tracking-widest">No matching reviews found</p>
                <button onClick={clearFilters} className="text-primary text-xs hover:underline">Reset all filters</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}