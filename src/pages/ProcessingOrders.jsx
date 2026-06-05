import { useLocation } from "react-router-dom";
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
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import Pagination from "../components/ui/Pagination";
import { Link, useNavigate } from "react-router-dom";
import { downloadInvoiceExcel } from "../lib/invoiceExcel";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrders,
  fetchOrderCounts,
  duplicateOrder,
  deleteOrder,
  updateOrder,
  fetchPickupAddresses,
} from "../redux/orderSlice";
import OrderDetailsModal from "../components/modals/OrderDetailsModal";
import EditWeightModal from "../components/modals/EditWeightModal";
import ChangePickupAddressModal from "../components/modals/ChangePickupAddressModal";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "../lib/generateInvoicePDF";
import { mapOrderToInvoice } from "../lib/invoiceMapper";
import { generateShippingLabel } from "../lib/generateShippingLabel";
import {
  generateInvoiceApi,
  fetchBulkOrdersApi,
  generateBulkInvoiceApi,
} from "../services/apiCalls";

export function ProcessingOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const [selectedPickupAddress, setSelectedPickupAddress] = useState("");

  const [pickupOrderIds, setPickupOrderIds] = useState([]);

  const [selectedWeightOrder, setSelectedWeightOrder] = useState(null);
  const navigate = useNavigate();

  const [bulkOrders, setBulkOrders] = useState([]);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkPages, setBulkPages] = useState(1);
  const [bulkPage, setBulkPage] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const location = useLocation();

  // Map route pathname → status filter value
  const pathToStatus = {
    "/dashboard/processing-order": "processing",
    "/dashboard/bulk-orders": "bulk",
    "/dashboard/all-orders": "",
    "/dashboard/manifested": "manifested",
    "/dashboard/picked": "picked",
    "/dashboard/dispatched": "dispatched",
    "/dashboard/warehouse-orders": "warehouse",
    "/dashboard/in-transit": "in_transit",
    "/dashboard/pending": "ndr",
    "/dashboard/out-for-delivery": "ofd",
    "/dashboard/delivered": "delivered",
    "/dashboard/rto-in-transit": "rto_in_transit",
    "/dashboard/rto-delivered": "rto_delivered",
    "/dashboard/returned": "returned",
    "/dashboard/cancelled": "cancelled",
    "/dashboard/lost": "lost",
  };

  const statusToPath = {
    "": "/dashboard/all-orders",
    manifested: "/dashboard/manifested",
    picked: "/dashboard/picked",
    dispatched: "/dashboard/dispatched",
    warehouse: "/dashboard/warehouse-orders",
    in_transit: "/dashboard/in-transit",
    ndr: "/dashboard/pending",
    ofd: "/dashboard/out-for-delivery",
    delivered: "/dashboard/delivered",
    rto_in_transit: "/dashboard/rto-in-transit",
    rto_delivered: "/dashboard/rto-delivered",
    returned: "/dashboard/returned",
    cancelled: "/dashboard/cancelled",
    lost: "/dashboard/lost",
  };

  const activeStatus =
    pathToStatus[location.pathname] ??
    pathToStatus["/dashboard/processing-order"];

  const handleTabClick = (tab) => {
    navigate(`/dashboard${tab.path}`);
  };

  const statusList = [
    "All",
    "Manifested",
    "Picked",
    "Dispatched",
    "Warehouse",
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

  // Map route pathname → tab name
  const pathToTab = {
    "/dashboard/processing-order": "Processing",
    "/dashboard/bulk-orders": "Bulk Order",
    "/dashboard/all-orders": "All Orders",
    "/dashboard/manifested": "Manifested",
    "/dashboard/picked": "Picked",
    "/dashboard/dispatched": "Dispatched",
    "/dashboard/warehouse-orders": "Warehouse",
    "/dashboard/in-transit": "In Transit",
    "/dashboard/pending": "NDR",
    "/dashboard/out-for-delivery": "OFD",
    "/dashboard/delivered": "Delivered",
    "/dashboard/rto-in-transit": "RTO In Transit",
    "/dashboard/rto-delivered": "RTO Delivered",
    "/dashboard/returned": "Returned",
    "/dashboard/cancelled": "Cancelled",
    "/dashboard/lost": "Lost",
  };

  const activeTab = pathToTab[location.pathname] || "Processing";

  const isProcessing = activeStatus === "processing";

  const dispatch = useDispatch();

  const {
    orders,
    totalOrders,
    totalPages,
    page,
    limit,
    loading,
    orderCounts,
    pickupAddresses,
  } = useSelector((state) => state.orders);

  const isPageLoading = activeStatus === "bulk" ? bulkLoading : loading;
  const refreshTrigger = useSelector(
    (state) => state.bulkOrders?.refreshTrigger || 0,
  );

  // Tracks the last-applied fetch params so page changes keep all active filters
  const currentFiltersRef = useRef({});

  const statusCounts = orderCounts?.status_counts || {};

  const tabs = [
    {
      name: "Processing",
      count: statusCounts.processing || 0,
      path: "/processing-order",
    },
    {
      name: "Bulk Order",
      count: bulkTotal || 0,
      path: "/bulk-orders",
    },
    {
      name: "All Orders",
      count: orderCounts?.total_orders || 0,
      path: "/all-orders",
    },
    {
      name: "Manifested",
      count: statusCounts.manifested || 0,
      path: "/manifested",
    },
    {
      name: "Picked",
      count: statusCounts.picked || 0,
      path: "/picked",
    },
    {
      name: "Dispatched",
      count: statusCounts.dispatched || 0,
      path: "/dispatched",
    },
    {
      name: "Warehouse",
      count: statusCounts.warehouse || 0,
      path: "/warehouse-orders",
    },
    {
      name: "In Transit",
      count: statusCounts.in_transit || 0,
      path: "/in-transit",
    },
    {
      name: "NDR",
      count: statusCounts.ndr || 0,
      path: "/pending",
    },
    {
      name: "OFD",
      count: statusCounts.ofd || 0,
      path: "/out-for-delivery",
    },
    {
      name: "Delivered",
      count: statusCounts.delivered || 0,
      path: "/delivered",
    },
    {
      name: "RTO In Transit",
      count: statusCounts.rto_in_transit || 0,
      path: "/rto-in-transit",
    },
    {
      name: "RTO Delivered",
      count: statusCounts.rto_delivered || 0,
      path: "/rto-delivered",
    },
    {
      name: "Returned",
      count: statusCounts.returned || 0,
      path: "/returned",
    },
    {
      name: "Cancelled",
      count: statusCounts.cancelled || 0,
      path: "/cancelled",
    },
    {
      name: "Lost",
      count: statusCounts.lost || 0,
      path: "/lost",
    },
  ];

  const fetchBulkOrdersData = async (pageNum = 1) => {
    setBulkLoading(true);
    try {
      const res = await fetchBulkOrdersApi({
        page: pageNum,
        limit: filters.limit,
      });
      setBulkOrders(res.items || []);
      setBulkTotal(res.total || 0);
      setBulkPages(res.pages || 1);
      setBulkPage(res.page || pageNum);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bulk orders");
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    if (activeStatus === "bulk") {
      fetchBulkOrdersData(1);
    } else {
      setFilters((prev) => ({
        ...prev,
        status: activeStatus === "processing" ? "" : activeStatus,
      }));
      const params = {
        page: 1,
        limit: filters.limit,
        status_filter: activeStatus,
      };
      currentFiltersRef.current = params;
      dispatch(fetchOrders(params));
    }
  }, [location.pathname, filters.limit, refreshTrigger]);

  useEffect(() => {
    dispatch(fetchOrderCounts());
    const fetchBulkCount = async () => {
      try {
        const res = await fetchBulkOrdersApi({ limit: 1 });
        setBulkTotal(res.total || 0);
      } catch (err) {
        console.error("Failed to fetch bulk orders count", err);
      }
    };
    fetchBulkCount();
  }, [dispatch, refreshTrigger]);

  useEffect(() => {
    dispatch(fetchPickupAddresses());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    const payload = {
      page: 1,
      limit: filters.limit,
      status_filter: filters.status || activeStatus,
      order_id: filters.orderId || undefined,
      awb_no: filters.awb || undefined,
      buyer_name: filters.buyerName || undefined,
      payment_method: filters.paymentMethod || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
    };
    currentFiltersRef.current = payload;
    dispatch(fetchOrders(payload));
  };

  const handlePageChange = (newPage) => {
    const params = { ...currentFiltersRef.current, page: newPage };
    currentFiltersRef.current = params;
    dispatch(fetchOrders(params));
  };

  const handleGenerateBulkInvoice = async (bulkOrder) => {
    const toastId = toast.loading("Generating bulk invoice...");
    try {
      await generateBulkInvoiceApi(bulkOrder.id);
      toast.success("Bulk invoice generated successfully!", { id: toastId });
    } catch (error) {
      console.error("Error generating bulk invoice:", error);
      let errorMessage = "Failed to generate bulk invoice";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === "string") {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((d) => d.msg)
            .join(", ");
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleGenerateInvoicePDF = async (order) => {
    const toastId = toast.loading("Generating invoice...");
    try {
      await generateInvoiceApi(order.id);
      toast.success("Invoice generated successfully!", { id: toastId });
    } catch (error) {
      console.error("Error generating invoice:", error);
      let errorMessage = "Failed to generate invoice";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === "string") {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((d) => d.msg)
            .join(", ");
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleGenerateInvoiceExcel = async (order, mappedOrder) => {
    const toastId = toast.loading("Generating invoice...");
    try {
      await generateInvoiceApi(order.id);
      toast.success("Invoice generated successfully!", { id: toastId });
    } catch (error) {
      console.error("Error generating invoice:", error);
      let errorMessage = "Failed to generate invoice";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === "string") {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((d) => d.msg)
            .join(", ");
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleDuplicateOrder = async (orderId) => {
    const toastId = toast.loading("Duplicating order...");

    try {
      await dispatch(duplicateOrder(orderId)).unwrap();

      dispatch(fetchOrderCounts());

      toast.success("Order duplicated successfully", {
        id: toastId,
      });
    } catch (error) {
      console.error(error);

      toast.error("Failed to duplicate order", {
        id: toastId,
      });
    }
  };

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      return toast.error("Please select at least one order");
    }

    const toastId = toast.loading("Deleting orders...");

    try {
      await Promise.all(
        selectedOrders.map((id) => dispatch(deleteOrder(id)).unwrap()),
      );

      dispatch(fetchOrderCounts());

      setSelectedOrders([]);

      toast.success("Orders deleted successfully", {
        id: toastId,
      });
    } catch (error) {
      console.error(error);

      toast.error("Failed to delete orders", {
        id: toastId,
      });
    }
  };

  const handleUpdateWeight = async (packages) => {
    const toastId = toast.loading("Updating weight...");

    try {
      const {
        id,
        pickup_address,
        consignee,
        warehouse_addresses,
        items,
        ...rest
      } = selectedWeightOrder;

      const payload = {
        ...rest,

        pickup_address_id: pickup_address?.id,

        consignee_id: consignee?.id,

        warehouse_addresses_id: warehouse_addresses?.id,

        items: items.map((item) => ({
          product_name: item.product_name,
          sku: item.sku,
          unit_price: item.unit_price,
          qty: item.qty,
          total: item.total,
        })),

        packages: packages.map((pkg) => {
          const totalPhysicalWeight =
            Number(pkg.physical_weight_kg || 0) * Number(pkg.count || 1);

          const totalVolWeight =
            Number(pkg.vol_weight_kg || 0) * Number(pkg.count || 1);

          return {
            count: Number(pkg.count),

            length_cm: Number(pkg.length_cm),

            breadth_cm: Number(pkg.breadth_cm),

            height_cm: Number(pkg.height_cm),

            physical_weight_kg: Number(totalPhysicalWeight.toFixed(2)),

            vol_weight_kg: Number(totalVolWeight.toFixed(2)),
          };
        }),
      };

      await dispatch(
        updateOrder({
          orderId: id,
          data: payload,
        }),
      ).unwrap();

      dispatch(fetchOrderCounts());

      toast.success("Weight updated successfully", {
        id: toastId,
      });

      setIsWeightModalOpen(false);
    } catch (error) {
      console.error(error);

      toast.error("Failed to update weight", {
        id: toastId,
      });
    }
  };

  const handleChangePickupAddress = async () => {
    if (!selectedPickupAddress) {
      return toast.error("Please select pickup address");
    }

    const toastId = toast.loading("Updating pickup address...");

    try {
      const selectedPickup = pickupAddresses.find(
        (addr) => addr.id === selectedPickupAddress,
      );

      await Promise.all(
        pickupOrderIds.map((order) => {
          if (!order) return null;

          const payload = {
            order_type: order.order_type,

            pickup_address_id: selectedPickup.id,

            consignee_id: order.consignee?.id,

            payment_method: order.payment_method,

            cod_amount: order.cod_amount || 0,

            to_pay_amount: order.to_pay_amount || 0,

            rov: order.rov || "owner_risk",

            order_value: order.order_value || 0,

            gst_number: order.gst_number || "",

            eway_bill_number: order.eway_bill_number || "",

            shipping_charge: order.shipping_charge || 0,

            items: order.items.map((item) => ({
              product_name: item.product_name,
              sku: item.sku,
              unit_price: item.unit_price,
              qty: item.qty,
              total: item.total,
            })),

            packages: order.packages.map((pkg) => ({
              count: pkg.count,
              length_cm: pkg.length_cm,
              breadth_cm: pkg.breadth_cm,
              height_cm: pkg.height_cm,
              vol_weight_kg: pkg.vol_weight_kg,
              physical_weight_kg: pkg.physical_weight_kg,
            })),
          };

          return dispatch(
            updateOrder({
              orderId: order.id,
              data: payload,
            }),
          ).unwrap();
        }),
      );

      toast.success("Pickup address updated successfully", {
        id: toastId,
      });

      setIsPickupModalOpen(false);

      setPickupOrderIds([]);

      setSelectedPickupAddress("");
    } catch (error) {
      console.error(error);

      toast.error("Failed to update pickup address", {
        id: toastId,
      });
    }
  };

  const handleExportOrders = () => {
    const selected = orders.filter((order) =>
      selectedOrders.includes(order.id),
    );

    if (selected.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

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

      dims: `${order.packages?.[0]?.length_cm || 0}×${
        order.packages?.[0]?.breadth_cm || 0
      }×${order.packages?.[0]?.height_cm || 0}`,

      created: order.created_at,

      order: {
        id: order.order_number,
      },
    }));

    downloadInvoiceExcel(mappedOrders);
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
              {activeTab} {activeStatus === "bulk" ? "" : "Orders"} (Showing{" "}
              {activeStatus === "bulk" ? bulkOrders.length : orders.length}{" "}
              entries)
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {activeStatus === "bulk" ? null : isProcessing ? (
                <>
                  <Button className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9">
                    <Ship size={16} /> Ship
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedOrders.length === 0) {
                        return toast.error("Please select at least one order");
                      }

                      const selectedOrdersData = orders.filter((o) =>
                        selectedOrders.includes(o.id),
                      );

                      setPickupOrderIds(selectedOrdersData);

                      // select current pickup address automatically
                      const firstSelectedOrder = orders.find(
                        (o) => o.id === selectedOrders[0],
                      );

                      if (firstSelectedOrder?.pickup_address?.id) {
                        setSelectedPickupAddress(
                          firstSelectedOrder.pickup_address.id,
                        );
                      }

                      setIsPickupModalOpen(true);
                    }}
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9"
                  >
                    <MapPin size={16} /> Change Pickup Address
                  </Button>
                  <Button
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9"
                    onClick={handleExportOrders}
                  >
                    <Download size={16} /> Export
                  </Button>
                  <Button
                    onClick={handleDeleteOrders}
                    className="bg-red-500 text-white hover:bg-red-600 text-xs font-bold gap-2 h-9"
                  >
                    <Trash2 size={16} /> Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9"
                    onClick={() => {
                      if (selectedOrders.length === 0) {
                        return toast.error("Please select at least one order");
                      }

                      const selectedOrdersData = orders.filter((o) =>
                        selectedOrders.includes(o.id),
                      );

                      generateShippingLabel(selectedOrdersData);
                    }}
                  >
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
                    onClick={handleExportOrders}
                  >
                    <Download size={16} /> Export
                  </Button>
                  <Button
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold gap-2 h-9"
                    onClick={() => {
                      if (selectedOrders.length === 0) {
                        return toast.error("Please select at least one order");
                      }

                      const selectedOrderData = orders.find(
                        (o) => o.id === selectedOrders[0],
                      );

                      if (!selectedOrderData) {
                        return toast.error("Order not found");
                      }

                      handleGenerateInvoicePDF(selectedOrderData);
                    }}
                  >
                    <FileText size={16} /> Invoices
                  </Button>
                </>
              )}
            </div>
          </div>

          {activeStatus !== "bulk" && (
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

                <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">
                      Status:
                    </label>
                    <div className="h-28 overflow-y-auto border border-border-subtle rounded-lg bg-card-bg p-1 text-[11px] custom-scrollbar">
                      {statusList.map((s) => (
                        <div
                          key={s}
                          onClick={() => {
                            const newStatus =
                              s === "All"
                                ? ""
                                : s.toLowerCase().replace(/\s+/g, "_");
                            setFilters({
                              ...filters,
                              status: newStatus,
                            });
                            const mappedPath = statusToPath[newStatus];
                            if (mappedPath) {
                              navigate(mappedPath);
                            }
                          }}
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

                <div className="self-end space-y-2">
                  <Button
                    onClick={handleSearch}
                    className="w-full bg-primary text-black hover:bg-primary/90 h-[34px] text-xs font-bold shadow-sm"
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
                        status:
                          activeStatus === "processing" ? "" : activeStatus,
                        limit: 25,
                      });

                      const params = {
                        page: 1,
                        limit: 25,
                        status_filter: activeStatus,
                      };
                      currentFiltersRef.current = params;
                      dispatch(fetchOrders(params));
                    }}
                    className="text-xs font-bold text-primary flex items-center justify-center gap-1 w-full"
                  >
                    <RotateCcw size={14} /> Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4 overflow-x-auto border-b border-border-subtle bg-card-bg">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => handleTabClick(tab)}
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

          {isPageLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {activeStatus === "bulk" ? (
                      <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase border-b border-border-subtle">
                        <th className="px-6 py-4">File Name</th>
                        <th className="px-6 py-4">Order Type</th>
                        <th className="px-6 py-4">Pickup Address ID</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Successful Orders</th>
                        <th className="px-6 py-4">Failed Orders</th>
                        <th className="px-6 py-4">Created At</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    ) : (
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
                        {!isProcessing && (
                          <th className="px-6 py-4">Shipment</th>
                        )}
                        <th className="px-6 py-4">Route</th>
                        <th className="px-6 py-4">Payment</th>
                        {isProcessing ? (
                          <th className="px-6 py-4">Order Details</th>
                        ) : (
                          <th className="px-6 py-4">Weight</th>
                        )}
                        {!isProcessing && (
                          <th className="px-6 py-4">Created</th>
                        )}
                        {isProcessing && (
                          <th className="px-6 py-4">Weight/Dims</th>
                        )}
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {activeStatus === "bulk"
                      ? bulkOrders.map((bulkOrder, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-dashboard-bg/30 transition-colors"
                          >
                            <td className="px-6 py-6 text-sm font-bold text-text-main">
                              {bulkOrder.file_name}
                            </td>
                            <td className="px-6 py-6 text-xs text-text-muted uppercase">
                              {bulkOrder.order_type}
                            </td>
                            <td className="px-6 py-6 text-xs text-text-muted">
                              {bulkOrder.pickup_address_id}
                            </td>
                            <td className="px-6 py-6 text-xs">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                  bulkOrder.status === "completed" ||
                                    bulkOrder.status === "processed"
                                    ? "bg-green-100 text-green-600"
                                    : bulkOrder.status === "failed"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-orange-100 text-orange-600",
                                )}
                              >
                                {bulkOrder.status}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-xs font-bold text-text-main">
                              {bulkOrder.successful_orders} /{" "}
                              {bulkOrder.total_orders}
                            </td>
                            <td className="px-6 py-6 text-xs font-bold text-red-500">
                              {bulkOrder.failed_orders}
                            </td>
                            <td className="px-6 py-6 text-xs text-text-muted">
                              {formatDate(bulkOrder.created_at)}
                            </td>
                            <td className="px-6 py-6 text-center">
                              <button
                                onClick={() =>
                                  handleGenerateBulkInvoice(bulkOrder)
                                }
                                className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md shadow-sm transition-colors"
                              >
                                <Printer size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      : orders.map((order, idx) => {
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
                              courier:
                                order.courier_name || "Courier not selected",
                            },
                            route: {
                              from: order.pickup_address?.city || "N/A",
                              fromPin: order.pickup_address?.pincode || "",
                              to: order.consignee?.city || "N/A",
                              toPin: order.consignee?.pincode || "",
                            },
                            payment: {
                              method: order.payment_method || "N/A",

                              total: `₹${order.order_value || 0}`,

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
                                      setSelectedOrders([
                                        ...selectedOrders,
                                        order.id,
                                      ]);
                                    } else {
                                      setSelectedOrders(
                                        selectedOrders.filter(
                                          (id) => id !== order.id,
                                        ),
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
                                  <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block mt-1">
                                    {mappedOrder.order.channel}
                                  </span>
                                </td>
                              ) : (
                                <td className="px-6 py-6 text-xs font-bold text-text-main">
                                  {mappedOrder.weight}
                                </td>
                              )}

                              {!isProcessing && (
                                <td className="px-6 py-6 text-xs text-text-muted">
                                  {mappedOrder.created}
                                </td>
                              )}

                              {isProcessing && (
                                <td className="px-6 py-6 text-xs">
                                  <div className="space-y-1">
                                    <p className="font-bold text-text-main">
                                      {mappedOrder.weight}
                                    </p>
                                    <p className="text-text-muted">
                                      {mappedOrder.dims}
                                    </p>
                                  </div>
                                </td>
                              )}

                              <td className="px-6 py-6 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {isProcessing ? (
                                    [Truck, Eye, Copy, Edit, Printer].map(
                                      (Icon, i) => (
                                        <button
                                          key={i}
                                          onClick={() => {
                                            // VIEW
                                            if (Icon === Eye) {
                                              setSelectedOrder(mappedOrder);
                                              setIsModalOpen(true);
                                            }

                                            // DUPLICATE
                                            if (Icon === Copy) {
                                              handleDuplicateOrder(order.id);
                                            }

                                            // EDIT
                                            if (Icon === Edit) {
                                              navigate(
                                                `/dashboard/edit-order/${order.id}`,
                                                {
                                                  state: { order },
                                                },
                                              );
                                            }

                                            // PRINT INVOICE
                                            if (Icon === Printer) {
                                              handleGenerateInvoicePDF(order);
                                            }
                                          }}
                                          className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md shadow-sm transition-colors"
                                        >
                                          <Icon size={14} />
                                        </button>
                                      ),
                                    )
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleGenerateInvoiceExcel(
                                            order,
                                            mappedOrder,
                                          )
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
                                      <div className="relative" ref={menuRef}>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();

                                            if (openMenuId === order.id) {
                                              setOpenMenuId(null);
                                            } else {
                                              setOpenMenuId(order.id);
                                            }
                                          }}
                                          className="p-1.5 text-text-muted hover:text-text-main rounded-md hover:bg-dashboard-bg/60 transition"
                                        >
                                          <MoreVertical size={16} />
                                        </button>

                                        {openMenuId === order.id && (
                                          <div className="absolute right-0 top-9 w-[190px] bg-card-bg border border-border-subtle rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
                                            {/* DUPLICATE */}
                                            <button
                                              onClick={() => {
                                                handleDuplicateOrder(order.id);
                                                setOpenMenuId(null);
                                              }}
                                              className="w-full h-[44px] flex items-center gap-2.5 px-4 text-[13px] font-medium text-text-main hover:bg-dashboard-bg/60 transition"
                                            >
                                              <Copy
                                                size={15}
                                                strokeWidth={1.9}
                                                className="text-text-muted"
                                              />

                                              <span>Duplicate Order</span>
                                            </button>

                                            <div className="h-px bg-border-subtle" />

                                            {/* DOWNLOAD INVOICE */}
                                            <button
                                              onClick={() => {
                                                handleGenerateInvoicePDF(order);
                                                setOpenMenuId(null);
                                              }}
                                              className="w-full h-[44px] flex items-center gap-2.5 px-4 text-[13px] font-medium text-text-main hover:bg-dashboard-bg/60 transition"
                                            >
                                              <Printer
                                                size={15}
                                                strokeWidth={1.9}
                                                className="text-text-muted"
                                              />

                                              <span>Generate Invoice</span>
                                            </button>

                                            <div className="h-px bg-border-subtle" />

                                            {/* VIEW CHARGES */}
                                            <button
                                              onClick={() => {
                                                console.log("View Charges");
                                                setOpenMenuId(null);
                                              }}
                                              className="w-full h-[44px] flex items-center gap-2.5 px-4 text-[13px] font-medium text-text-main hover:bg-dashboard-bg/60 transition"
                                            >
                                              <FileText
                                                size={15}
                                                strokeWidth={1.9}
                                                className="text-text-muted"
                                              />

                                              <span>View Charges</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
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
              {activeStatus === "bulk" ? (
                <Pagination
                  currentPage={activeStatus === "bulk" ? bulkPage : page}
                  totalPages={activeStatus === "bulk" ? bulkPages : totalPages}
                  totalEntries={
                    activeStatus === "bulk" ? bulkTotal : totalOrders
                  }
                  limit={limit}
                  onPageChange={(newPage) => {
                    if (activeStatus === "bulk") {
                      fetchBulkOrdersData(newPage);
                    } else {
                      handlePageChange(newPage);
                    }
                  }}
                />
              ) : (
                <Pagination
                  currentPage={activeStatus === "bulk" ? bulkPage : page}
                  totalPages={activeStatus === "bulk" ? bulkPages : totalPages}
                  totalEntries={
                    activeStatus === "bulk" ? bulkTotal : totalOrders
                  }
                  limit={limit}
                  onPageChange={(newPage) => {
                    if (activeStatus === "bulk") {
                      fetchBulkOrdersData(newPage);
                    } else {
                      handlePageChange(newPage);
                    }
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
      <EditWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        order={selectedWeightOrder}
        onSave={handleUpdateWeight}
      />
      <ChangePickupAddressModal
        isOpen={isPickupModalOpen}
        onClose={() => setIsPickupModalOpen(false)}
        pickupAddresses={pickupAddresses}
        selectedPickupAddress={selectedPickupAddress}
        setSelectedPickupAddress={setSelectedPickupAddress}
        pickupOrderIds={pickupOrderIds}
        onSubmit={handleChangePickupAddress}
      />
    </div>
  );
}
