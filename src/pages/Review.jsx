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
} from "lucide-react";

import { Card, CardContent } from "../components/ui/card";

import { Button } from "../components/ui/button";

import { cn } from "../lib/utils";

export function Review() {
  const [reviewType, setReviewType] = useState("service");

  const [searchTerm, setSearchTerm] = useState("");

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

  // ORDER REVIEW DEMO DATA
  const [orderReviews, setOrderReviews] = useState([
    {
      id: "OR001",
      order_id: "ORD-2026-1001",
      auth_users_id: "USR100",
      review: "Package arrived in perfect condition.",
      rating: "5",
      status: "Pending",
    },

    {
      id: "OR002",
      order_id: "ORD-2026-1002",
      auth_users_id: "USR101",
      review: "Delivery was delayed by one day.",
      rating: "3",
      status: "Approved",
    },

    {
      id: "OR003",
      order_id: "ORD-2026-1003",
      auth_users_id: "USR102",
      review: "Very fast shipping and professional packaging.",
      rating: "5",
      status: "Pending",
    },
  ]);

  const selectedReviews =
    reviewType === "service" ? serviceReviews : orderReviews;

  const filteredReviews = useMemo(() => {
    return selectedReviews.filter((review) => {
      // SERVICE SEARCH
      const serviceSearch = review.user_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      // ORDER SEARCH
      const orderSearch = review.order_id
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSearch =
        !searchTerm || (reviewType === "service" ? serviceSearch : orderSearch);

      const matchesStatus =
        reviewType === "service"
          ? true
          : statusFilter === "All"
            ? true
            : review.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [selectedReviews, searchTerm, reviewType, statusFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const filterInputClass =
    "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
          Reviews
        </h1>

        <p className="text-xs md:text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">
            Dashboard
          </Link>
          <span className="text-text-muted mx-2">&gt;&gt;</span>
          Reviews
        </p>
      </div>

      {/* REVIEW TYPE */}
      <div className="w-full rounded-2xl border border-border-subtle bg-card-bg px-6 py-5 flex flex-wrap gap-8 items-center">
        <div className="text-sm font-bold text-text-main">Review Type *</div>

        {/* SERVICE */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setReviewType("service")}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center",
              reviewType === "service"
                ? "border-primary"
                : "border-border-subtle",
            )}
          >
            {reviewType === "service" && (
              <div className="w-3 h-3 rounded-full bg-primary" />
            )}
          </div>

          <span className="text-white font-medium">Service Review</span>
        </div>

        {/* ORDER */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setReviewType("order")}
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center",
              reviewType === "order"
                ? "border-primary"
                : "border-border-subtle",
            )}
          >
            {reviewType === "order" && (
              <div className="w-3 h-3 rounded-full bg-primary" />
            )}
          </div>

          <span className="text-white font-medium">Order Review</span>
        </div>
      </div>

      {/* FILTER */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* SEARCH */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                {reviewType === "service" ? "Search User" : "Search Order ID"}
              </label>

              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />

                <input
                  type="text"
                  placeholder={
                    reviewType === "service" ? "User name..." : "Order ID..."
                  }
                  className={cn(filterInputClass, "pl-10 w-[260px]")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* STATUS FILTER */}
            {reviewType === "order" && (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                  Status
                </label>

                {/* SELECT BOX */}
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-[180px] h-10 rounded-lg border border-border-subtle bg-card-bg px-3 py-2 text-xs text-text-main flex items-center justify-between transition-all"
                >
                  <span>{statusFilter}</span>

                  <span className="text-text-muted text-xs">▼</span>
                </button>

                {/* DROPDOWN */}
                {isStatusOpen && (
                  <div className="absolute top-[72px] left-0 w-[180px] rounded-lg border border-border-subtle bg-card-bg shadow-2xl overflow-hidden z-50">
                    <div className="max-h-[180px] overflow-y-auto p-2 space-y-1">
                      {["All", "Approved", "Pending"].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);

                            setIsStatusOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-xs transition-all",
                            statusFilter === status
                              ? "bg-white text-black font-semibold"
                              : "text-text-muted hover:bg-dashboard-bg",
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
            
            {/* FILTER BUTTON */}
            <div className="flex items-center gap-2">
              <Button className="bg-primary hover:bg-primary/90 text-black h-10 text-xs font-bold px-8">
                <Filter size={14} className="mr-2" />
                Filter
              </Button>

              {/* RESET */}
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-10 px-3 text-text-muted border border-border-subtle"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LOADING */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />

          <p className="text-text-muted text-sm">Loading reviews...</p>
        </div>
      ) : (
        <Card className="bg-card-bg border-border-subtle overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-dashboard-bg/50 border-b border-border-subtle">
                    {/* SERVICE TABLE */}
                    {reviewType === "service" ? (
                      <>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Review ID
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          User Name
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Rating
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Review
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Created At
                        </th>
                      </>
                    ) : (
                      <>
                        {/* ORDER TABLE */}

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Review ID
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Order ID
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          User ID
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Rating
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Review
                        </th>

                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-subtle">
                  {filteredReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-dashboard-bg/20 transition-colors"
                    >
                      {/* SERVICE ROW */}
                      {reviewType === "service" ? (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-text-main">
                            {review.id}
                          </td>

                          <td className="px-6 py-4 text-sm text-text-main">
                            {review.user_name}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Star size={14} className="text-primary" />

                              <span className="text-sm font-bold text-text-main">
                                {review.rating}/5
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-text-muted max-w-md">
                              {review.review}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-xs text-text-muted">
                            {new Date(review.created_at).toLocaleString()}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* ORDER ROW */}

                          <td className="px-6 py-4 text-sm font-medium text-text-main">
                            {review.id}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-text-main">
                              <Package size={14} className="text-primary" />

                              {review.order_id}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-text-muted">
                            {review.auth_users_id}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Star size={14} className="text-primary" />

                              <span className="text-sm font-bold text-text-main">
                                {review.rating}/5
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-start gap-2">
                              <MessageSquare
                                size={14}
                                className="text-primary mt-0.5"
                              />

                              <p className="text-sm text-text-muted max-w-md">
                                {review.review}
                              </p>
                            </div>
                          </td>

                          {/* TOGGLE STATUS */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setOrderReviews((prev) =>
                                    prev.map((item) =>
                                      item.id === review.id
                                        ? {
                                            ...item,
                                            status:
                                              item.status === "Approved"
                                                ? "Pending"
                                                : "Approved",
                                          }
                                        : item,
                                    ),
                                  );
                                }}
                                className={cn(
                                  "relative w-9 h-5 rounded-full transition-all duration-300",
                                  review.status === "Approved"
                                    ? "bg-green-500"
                                    : "bg-yellow-500",
                                )}
                              >
                                <span
                                  className={cn(
                                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                    review.status === "Approved"
                                      ? "translate-x-4"
                                      : "translate-x-0",
                                  )}
                                />
                              </button>

                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase",
                                  review.status === "Approved"
                                    ? "text-green-400"
                                    : "text-yellow-400",
                                )}
                              >
                                {review.status}
                              </span>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filteredReviews.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-text-muted font-bold text-sm uppercase tracking-widest">
                  No Reviews Found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
