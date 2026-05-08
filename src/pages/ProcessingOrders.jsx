import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  RotateCcw,
  Truck,
  Eye,
  Copy,
  Edit,
  Printer,
  Ship,
  MapPin,
  Download,
  Trash2,
  FileText,
  Tag,
  MoreVertical,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import { downloadInvoiceExcel } from "../lib/invoiceExcel";
import { generateInvoicePDF } from "../lib/invoiceGenerator";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../redux/orderSlice";
import OrderDetailsModal from "../components/modals/OrderDetailsModal";

export function ProcessingOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]); // for table selection
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    orderId: "",
    awb: "",
    buyerName: "",
    paymentMethod: "",
    status: "",
    limit: 25,
  });

  const tabs = [
    { name: "Processing", count: 28, path: "/processing-order" },
    { name: "All Orders", count: 109, path: "/all-orders" },
    { name: "Manifested", count: 108, path: "/manifested" },
    { name: "In Transit", count: 1, path: "/in-transit" },
    { name: "NDR", count: 12, path: "/pending" },
    { name: "OFD", count: 0, path: "/out-for-delivery" },
    { name: "Delivered", count: 0, path: "/delivered" },
    { name: "RTO In Transit", count: 0, path: "/rto-in-transit" },
    { name: "RTO Delivered", count: 0, path: "/rto-delivered" },
    { name: "Returned", count: 0, path: "/returned" },
    { name: "Cancelled", count: 0, path: "/cancelled" },
    { name: "Lost", count: 0, path: "/lost" },
  ];

  const [searchParams, setSearchParams] = useSearchParams();

  const activeStatus = searchParams.get("status") || "processing";

  const tabStatusMap = {
    Processing: "processing",
    "All Orders": "",
    Manifested: "manifested",
    "In Transit": "in_transit",
    NDR: "ndr",
    OFD: "ofd",
    Delivered: "delivered",
    "RTO In Transit": "rto_in_transit",
    "RTO Delivered": "rto_delivered",
    Returned: "returned",
    Cancelled: "cancelled",
    Lost: "lost",
  };

  const handleTabClick = (tabName) => {
    const status = tabStatusMap[tabName];

    if (!status) {
      // All Orders
      setSearchParams({ status: "all" }); // force change
    } else {
      setSearchParams({ status });
    }
  };

  const statusList = [
    "All",
    "Manifested",
    "Picked",
    "Not Picked",
    "In Transit",
    "NDR",
    "OFD",
    "Delivered",
    "RTO In Transit",
    "RTO Delivered",
    "Returned",
    "Cancelled",
    "Lost",
  ];

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusToTabMap = {
    all: "All Orders",
    processing: "Processing",
    manifested: "Manifested",
    in_transit: "In Transit",
    ndr: "NDR",
    ofd: "OFD",
    delivered: "Delivered",
    rto_in_transit: "RTO In Transit",
    rto_delivered: "RTO Delivered",
    returned: "Returned",
    cancelled: "Cancelled",
    lost: "Lost",
  };

  const activeTab = statusToTabMap[activeStatus] || "Processing";

  const isProcessing = activeStatus === "processing";

  const dispatch = useDispatch();

  const { orders, totalOrders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    let statusFromUrl = searchParams.get("status");

    // default initial tab
    if (!statusFromUrl) {
      statusFromUrl = "processing";
    }

    // backend expects empty for all
    if (statusFromUrl === "all") {
      statusFromUrl = "";
    }

    dispatch(
      fetchOrders({
        page: 1,
        limit: filters.limit,
        status_filter: statusFromUrl,
      }),
    );
  }, [searchParams, filters.limit]);

  const handleSearch = () => {
    const currentStatus = searchParams.get("status");

    const payload = {
      page: 1,
      limit: filters.limit,

      status_filter:
        filters.status ||
        (currentStatus === "all" ? "" : currentStatus || "processing"),

      order_id: filters.orderId,
      awb_no: filters.awb,
      buyer_name: filters.buyerName,
      payment_method: filters.paymentMethod,
    };

    if (filters.startDate) {
      payload.start_date = filters.startDate;
    }

    if (filters.endDate) {
      payload.end_date = filters.endDate;
    }

    dispatch(fetchOrders(payload));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {activeTab} Orders
          </h1>
          <p className="text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">
              Dashboard
            </Link>
            <span className="text-text-muted mx-1">&gt;&gt;</span> {activeTab}{" "}
            Orders
          </p>
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-main">
              {activeTab} Orders (Showing {orders.length} entries)
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {isProcessing ? (
                <>
                  <Button className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9">
                    <Ship size={16} /> Ship
                  </Button>
                  <Button className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9">
                    <MapPin size={16} /> Change Pickup Address
                  </Button>
                  <Button className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9">
                    <Download size={16} /> Export
                  </Button>
                  <Button className="bg-red-500 text-white hover:bg-red-600 text-xs font-bold gap-2 h-9">
                    <Trash2 size={16} /> Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9">
                    <Tag size={16} /> Labels
                  </Button>
                  {activeTab === "Manifested" && (
                    <Button className="bg-primary text-black text-xs font-bold h-9 px-4 gap-2">
                      <FileText size={16} /> Manifests
                    </Button>
                  )}
                  {activeTab === "Manifested" && (
                    <Button className="bg-red-500 text-white text-xs font-bold h-9 px-4 gap-2">
                      <X size={16} /> Cancel
                    </Button>
                  )}
                  <Button
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9"
                    onClick={() => {
                      const getOrderId = (order) => order.id;

                      // ✅ filter selected rows
                      const selected = orders.filter((o) =>
                        selectedOrders.includes(getOrderId(o)),
                      );

                      // ❌ if nothing selected → stop
                      if (selected.length === 0) {
                        alert("Please select at least one order");
                        return;
                      }

                      // ✅ map to your excel format
                      const mappedOrders = selected.map((order) => ({
                        transactionId: order.id,
                        id: order.order_number,
                        customer: {
                          name: order.consignee?.name || "N/A",
                          phone: order.consignee?.mobile || "N/A",
                        },
                        shipment: {
                          id: order.order_shipment || "",
                          courier: order.courier_name || "",
                        },
                        route: {
                          from: order.pickup_address?.city || "",
                          fromPin: order.pickup_address?.pincode || "",
                          to: order.consignee?.city || "",
                          toPin: order.consignee?.pincode || "",
                        },
                        payment: {
                          method: order.payment_method || "",
                          total: order.order_value || 0,
                        },
                        weight: `${order.weight_summary?.total_weight_kg || 0} kg`,
                        dims: `${order.packages?.[0]?.length_cm || 0}×${order.packages?.[0]?.breadth_cm || 0}×${order.packages?.[0]?.height_cm || 0}`,
                        created: order.created_at,
                        order: {
                          id: order.order_number,
                        },
                      }));

                      // export ONLY selected
                      downloadInvoiceExcel(mappedOrders);
                    }}
                  >
                    <Download size={16} /> Export
                  </Button>
                  <Button
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9"
                    onClick={() => generateInvoicePDF(orders[0])}
                  >
                    <FileText size={16} /> Invoices
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Starting Date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                  />

                  <Calendar
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Ending Date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                  />

                  <Calendar
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Order ID
                </label>
                <input
                  type="text"
                  value={filters.orderId}
                  onChange={(e) =>
                    setFilters({ ...filters, orderId: e.target.value })
                  }
                  placeholder="Order Ids"
                  className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                />
              </div>
              {!isProcessing && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    AWB NO
                  </label>
                  <input
                    type="text"
                    value={filters.awb}
                    onChange={(e) =>
                      setFilters({ ...filters, awb: e.target.value })
                    }
                    placeholder="AWB No"
                    className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Buyer Name
                </label>
                <input
                  type="text"
                  value={filters.buyerName}
                  onChange={(e) =>
                    setFilters({ ...filters, buyerName: e.target.value })
                  }
                  placeholder="Buyer Name"
                  className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Payment Method:
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    setFilters({ ...filters, paymentMethod: e.target.value })
                  }
                  className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main appearance-none focus:outline-none focus:border-primary"
                >
                  <option value="">All</option>
                  <option value="COD">COD</option>
                  <option value="Prepaid">Prepaid</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start gap-6">
              <div className="w-24 space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Limit:
                </label>
                <input
                  type="number"
                  value={filters.limit}
                  onChange={(e) =>
                    setFilters({ ...filters, limit: Number(e.target.value) })
                  }
                  className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              {!isProcessing && (
                <div className="w-48 space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Status:
                  </label>
                  <div className="h-28 overflow-y-auto border border-border-subtle rounded-lg bg-card-bg p-1 text-[11px] custom-scrollbar">
                    {statusList.map((s) => (
                      <div
                        key={s}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            status:
                              s === "All"
                                ? ""
                                : s.toLowerCase().replace(/\s+/g, "_"),
                          })
                        }
                        className={cn(
                          "px-2 py-1 rounded cursor-pointer transition-colors",
                          filters.status ===
                            (s === "All"
                              ? ""
                              : s.toLowerCase().replace(/\s+/g, "_")) ||
                            (s === "All" && !filters.status)
                            ? "bg-gray-200 font-bold text-black"
                            : "text-text-muted hover:bg-gray-50",
                        )}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="self-end">
                <Button
                  onClick={handleSearch}
                  className="bg-primary text-black hover:bg-primary/90 h-[34px] px-8 text-xs font-bold shadow-sm"
                >
                  Search
                </Button>
                <button
                  onClick={() => {
                    // 1. Reset local filters
                    setFilters({
                      startDate: "",
                      endDate: "",
                      orderId: "",
                      awb: "",
                      buyerName: "",
                      paymentMethod: "",
                      status: "",
                      limit: 25,
                    });

                    // 2. Clear URL params (VERY IMPORTANT)
                    setSearchParams({});

                    // 3. Fetch fresh data
                    dispatch(
                      fetchOrders({
                        page: 1,
                        limit: 25,
                        status_filter: "processing",
                      }),
                    );
                  }}
                  className="text-xs font-bold text-primary flex items-center gap-1 mt-2"
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 overflow-x-auto border-b border-border-subtle bg-card-bg">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => handleTabClick(tab.name)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                    activeTab === tab.name
                      ? "bg-primary text-black shadow-md scale-105"
                      : "bg-dashboard-bg text-text-muted hover:bg-gray-100",
                  )}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase border-b border-border-subtle">
                  <th className="px-6 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        orders.length > 0 &&
                        selectedOrders.length === orders.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(orders.map((o) => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-4">Customer</th>
                  {!isProcessing && <th className="px-6 py-4">Shipment</th>}
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Payment</th>
                  {isProcessing ? (
                    <th className="px-6 py-4">Order Details</th>
                  ) : (
                    <th className="px-6 py-4">Weight</th>
                  )}
                  {!isProcessing && <th className="px-6 py-4">Created</th>}
                  {isProcessing && <th className="px-6 py-4">Weight/Dims</th>}
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {orders.map((order, idx) => {
                  const mappedOrder = {
                    transactionId: order.id,
                    id: order.order_number,
                    status: order.status,
                    customer: {
                      name: order.consignee?.name || "N/A",
                      phone: order.consignee?.mobile || "N/A",
                      date: formatDate(order.created_at),
                    },
                    shipment: {
                      id: order.order_shipment
                        ? order.order_shipment
                        : "No shipment ID",
                      courier: order.courier_name || "Courier not selected",
                    },
                    route: {
                      from: order.pickup_address?.city || "N/A",
                      fromPin: order.pickup_address?.pincode || "",
                      to: order.consignee?.city || "N/A",
                      toPin: order.consignee?.pincode || "",
                    },
                    payment: {
                      method: order.payment_method || "N/A",

                      total: `₹${order.order_value || 0}`, // always total order value

                      payable:
                        order.payment_method === "COD"
                          ? `₹${order.cod_amount || 0}`
                          : "Paid",

                      channel: order.order_type || "N/A",
                    },
                    order: {
                      id: order.order_number || "N/A",
                      channel: order.order_type || "N/A",
                    },
                    items: order.items || [],
                    weight: `${order.weight_summary?.total_weight_kg || 0} kg`,
                    dims: `${
                      order.packages?.[0]?.length_cm || 0
                    }×${order.packages?.[0]?.breadth_cm || 0}×${
                      order.packages?.[0]?.height_cm || 0
                    } cm`,
                    created: order.created_at
                      ? formatDate(order.created_at)
                      : "N/A",
                  };

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-dashboard-bg/30 transition-colors"
                    >
                      <td className="px-6 py-6 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(
                                selectedOrders.filter((id) => id !== order.id),
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </td>

                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-text-main">
                            {mappedOrder.customer.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {mappedOrder.customer.phone}
                          </p>
                          <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block mt-1">
                            {mappedOrder.status}
                          </span>
                          {isProcessing && (
                            <p className="text-[10px] text-text-muted mt-1">
                              {mappedOrder.customer.date}
                            </p>
                          )}
                        </div>
                      </td>

                      {!isProcessing && (
                        <td className="px-6 py-6 text-xs font-bold text-text-main">
                          {mappedOrder.shipment.id}
                          <br />
                          <span className="font-normal text-text-muted">
                            {mappedOrder.shipment.courier}
                          </span>
                        </td>
                      )}

                      <td className="px-6 py-6">
                        <div className="text-xs font-bold text-text-main">
                          {mappedOrder.route.from}{" "}
                          <span className="text-[10px] font-normal text-text-muted">
                            ({mappedOrder.route.fromPin})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 my-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <div className="w-4 h-px bg-gray-300" />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <div className="text-xs font-bold text-text-main">
                          {mappedOrder.route.to}{" "}
                          <span className="text-[10px] font-normal text-text-muted">
                            ({mappedOrder.route.toPin})
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-6 text-xs">
                        <p className="font-bold text-red-500 uppercase tracking-tighter">
                          {mappedOrder.payment.method}
                        </p>

                        <p className="text-text-muted">
                          Total: {mappedOrder.payment.total}
                        </p>
                      </td>

                      {isProcessing ? (
                        <td className="px-6 py-6 text-xs">
                          <p className="font-bold text-text-main">
                            #{mappedOrder.order.id}
                          </p>

                          <p className="text-text-main">
                            {mappedOrder.items?.[0]?.product_name ||
                              "No Product"}
                          </p>

                          <p className="text-text-muted">
                            Qty: {mappedOrder.items?.[0]?.qty || 0} SKU:{" "}
                            {mappedOrder.items?.[0]?.sku || "N/A"}
                          </p>
                        </td>
                      ) : (
                        <td className="px-6 py-6 text-[11px]">
                          <p className="font-medium text-text-main">Box: 1</p>
                          <p className="text-text-muted">
                            Wt: {mappedOrder.weight}
                          </p>
                        </td>
                      )}

                      {isProcessing ? (
                        <td className="px-6 py-6 text-[11px]">
                          <p className="font-medium text-text-main">
                            1 Box • {mappedOrder.weight}
                          </p>
                          <p className="text-text-muted">{mappedOrder.dims}</p>
                        </td>
                      ) : (
                        <td className="px-6 py-6 text-xs font-bold text-text-main">
                          {mappedOrder.id}
                          <br />
                          <span className="font-normal text-text-muted">
                            {mappedOrder.created}
                          </span>
                        </td>
                      )}

                      <td className="px-6 py-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isProcessing ? (
                            [Truck, Eye, Copy, Edit, Printer].map((Icon, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (Icon === Eye) {
                                    setSelectedOrder(mappedOrder);
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md shadow-sm transition-colors"
                              >
                                <Icon size={14} />
                              </button>
                            ))
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  downloadInvoiceExcel(mappedOrder)
                                }
                                className="p-1.5 bg-primary text-black rounded-md shadow-sm transition-transform active:scale-95 hover:bg-primary/90"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(mappedOrder);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md shadow-sm transition-colors"
                              >
                                <Eye size={14} />
                              </button>
                              <button className="p-1.5 text-text-muted hover:text-text-main">
                                <MoreVertical size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination />
        </CardContent>
      </Card>
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
