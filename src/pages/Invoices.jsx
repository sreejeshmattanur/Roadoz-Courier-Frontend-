import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Download,
  Eye,
  Loader2,
  Search,
  Filter,
  RotateCcw,
  FileText,
} from "lucide-react";
import { generateInvoicePDF } from "../lib/generateInvoicePDF";
import Pagination from "../components/ui/Pagination";
import {
  fetchInvoices,
  fetchInvoiceDetail,
  clearSelectedInvoice,
} from "../redux/invoiceSlice";
import { InvoiceModal } from "../components/common/InvoiceModal";
import { cn } from "../lib/utils";
import { usePermission } from "../hooks/usePermission";

export function Invoices() {
  const dispatch = useDispatch();
  const { invoices: invoicePerms } = usePermission();
  const { items, pagination, loading, selectedInvoice, detailLoading } =
    useSelector((state) => state.invoices);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: "",
    startDate: "",
    endDate: "",
  });

  const filteredItems = useMemo(() => {
    return items.filter((inv) => {
      if (appliedFilters.startDate || appliedFilters.endDate) {
        const invoiceDate = new Date(inv.created_at);
        if (appliedFilters.startDate) {
          const start = new Date(appliedFilters.startDate);
          if (invoiceDate < start) return false;
        }
        if (appliedFilters.endDate) {
          const end = new Date(appliedFilters.endDate);
          end.setHours(23, 59, 59, 999);
          if (invoiceDate > end) return false;
        }
      }

      const orderNumber = inv.invoice_orders?.[0]?.order?.order_number;
      if (
        appliedFilters.searchTerm &&
        !inv.invoice_number
          ?.toLowerCase()
          .includes(appliedFilters.searchTerm.toLowerCase()) &&
        !orderNumber
          ?.toLowerCase()
          .includes(appliedFilters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [items, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = (customParams = {}) => {
    const params = {
      page: pagination?.page || 1,
      limit: pagination?.limit || 25,
      ...customParams,
    };
    dispatch(fetchInvoices(params));
  };

  const handlePageChange = (newPage) => {
    fetchData({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilter = () => {
    setAppliedFilters({ searchTerm, startDate, endDate });
    fetchData({ page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({ searchTerm: "", startDate: "", endDate: "" });
    fetchData({ page: 1 });
  };

  const handleViewDetails = (id) => {
    dispatch(fetchInvoiceDetail(id));
    setIsModalOpen(true);
  };

  const handleDownloadPDF = (invoice) => {
    const orderData = invoice.invoice_orders?.[0]?.order;
    const pickupAddress = orderData?.pickup_address;
    const consignee = orderData?.consignee;

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        ", " +
        date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) +
        " pm"
      );
    };

    const formatCurrency = (amount) => {
      return Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
    };

    const mappedOrder = {
      invoiceNo: invoice.invoice_number,
      created: formatDate(invoice.created_at),
      awb: "AWB_PENDING",
      id: orderData?.order_number || "N/A",
      pickup: {
        name: pickupAddress?.contact_name || "",
        address1: pickupAddress?.address_line_1 || "",
        address2: pickupAddress?.address_line_2 || "",
        city: `${pickupAddress?.city || ""}, ${pickupAddress?.state || ""} - ${pickupAddress?.pincode || ""}`,
        phone: pickupAddress?.phone || "",
      },
      customer: {
        name: consignee?.name || "",
        address1: consignee?.address_line_1 || "",
        address2: consignee?.address_line_2 || "",
        city: `${consignee?.city || ""}, ${consignee?.state || ""} - ${consignee?.pincode || ""}`,
        phone: consignee?.mobile || "",
      },
      product: {
        name: orderData?.product_name || "-",
        sku: orderData?.product_sku || "-",
        qty: orderData?.product_quantity || "-",
        value: orderData?.order_value
          ? formatCurrency(orderData.order_value)
          : "-",
      },
      weight: orderData?.weight || "-",
      dims: orderData?.dimensions || "-",
      charges: {
        freight: formatCurrency(invoice.invoice_orders?.[0]?.base_freight),
        fuel: formatCurrency(invoice.invoice_orders?.[0]?.fuel_surcharge),
        handling: formatCurrency(invoice.invoice_orders?.[0]?.handling_charges),
        insurance: formatCurrency(
          invoice.invoice_orders?.[0]?.insurance_charges,
        ),
        subtotal: formatCurrency(invoice.subtotal),
        gst: formatCurrency(invoice.tax_amount),
      },
      payment: {
        method: orderData?.payment_method || "N/A",
        total: formatCurrency(invoice.total_amount),
      },
      shipmentType: orderData?.order_type || "N/A",
      riskType: "owner_risk",
      totalBoxes: 1,
    };

    generateInvoicePDF(mappedOrder);
  };

  const handleExportCSV = () => {
    const headers = [
      "Invoice #",
      "Description",
      "Orders",
      "Subtotal",
      "Tax",
      "Total Amount",
      "Status",
      "Created At",
    ];
    const rows = filteredItems.map((inv) => [
      inv.invoice_number,
      `"${inv.description ? inv.description.split(/ from /i)[0].trim() : ""}"`,
      inv.orders_count,
      inv.subtotal,
      inv.tax_amount,
      inv.total_amount,
      inv.status,
      inv.created_at
        ? `"${new Date(inv.created_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}"`
        : "N/A",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "invoices_report.csv";
    link.click();
  };

  const formatCreatedAt = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDescription = (inv) =>
    inv.description ? inv.description.split(/ from /i)[0].trim() : "";

  const filterInputClass =
    "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
            Invoice Registry
          </h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span className="text-text-muted mx-2">&gt;&gt;</span> Invoice
            Management
          </p>
        </div>
        {invoicePerms.generate && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs"
            >
              <Download size={16} className="mr-2" /> Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Filter Card */}
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
                  placeholder="Invoice # or Order #..."
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
              <input
                type="date"
                className={filterInputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Ending Date
              </label>
              <input
                type="date"
                className={filterInputClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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
          <p className="text-text-muted text-sm">Loading invoices...</p>
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
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Orders</th>
                      <th className="px-6 py-4">Subtotal</th>
                      <th className="px-6 py-4">Tax</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Created At</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-dashboard-bg/20 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-primary text-xs">
                              {inv.invoice_number}
                            </div>
                            <div className="text-[9px] text-text-muted mt-0.5 uppercase">
                              {inv.status}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-text-muted max-w-xs truncate"
                            title={inv.description}
                          >
                            {getDescription(inv)}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-main">
                            {inv.orders_count}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-main">
                            ₹ {inv.subtotal.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-main">
                            ₹ {inv.tax_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-text-main">
                            ₹ {inv.total_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-main">
                            {formatCreatedAt(inv.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center gap-2">
                              {invoicePerms.view && (
                                <button
                                  onClick={() => handleViewDetails(inv.id)}
                                  className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                              {invoicePerms.generate && (
                                <button
                                  onClick={() => handleDownloadPDF(inv)}
                                  className="w-8 h-8 flex items-center justify-center text-black bg-primary border border-primary/20 rounded-lg hover:bg-primary/90"
                                  title="Download PDF"
                                >
                                  <Download size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-10 text-center text-text-muted italic"
                        >
                          {items.length === 0
                            ? "No invoices found."
                            : "No invoices match the filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredItems.length > 0 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  totalEntries={pagination.total}
                  limit={pagination.limit}
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((inv) => (
                <Card
                  key={inv.id}
                  className="bg-card-bg border-border-subtle overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-mono font-bold">
                        {inv.invoice_number}
                      </div>
                      <span className="text-[9px] text-text-muted uppercase font-bold">
                        {inv.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dashboard-bg flex items-center justify-center text-primary border border-border-subtle">
                          <FileText size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main">
                            ₹ {inv.total_amount.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-text-muted truncate max-w-[200px]">
                            {getDescription(inv)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-text-muted uppercase font-bold">
                            Orders
                          </span>
                          <p className="text-text-main font-medium">
                            {inv.orders_count}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] text-text-muted uppercase font-bold">
                            Tax
                          </span>
                          <p className="text-text-main font-medium">
                            ₹ {inv.tax_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted uppercase font-bold">
                            Created On
                          </span>
                          <span className="text-[11px] font-mono text-text-main">
                            {formatCreatedAt(inv.created_at)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {invoicePerms.view && (
                            <button
                              onClick={() => handleViewDetails(inv.id)}
                              className="p-2 bg-dashboard-bg border border-border-subtle text-primary rounded-lg"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {invoicePerms.generate && (
                            <button
                              onClick={() => handleDownloadPDF(inv)}
                              className="p-2 bg-primary border border-primary/20 text-black rounded-lg"
                            >
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card-bg border-border-subtle">
                <CardContent className="p-8 text-center text-text-muted italic">
                  {items.length === 0
                    ? "No invoices found."
                    : "No invoices match the filters."}
                </CardContent>
              </Card>
            )}
            {filteredItems.length > 0 && (
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

      {isModalOpen && (
        <InvoiceModal
          invoice={selectedInvoice}
          loading={detailLoading}
          onClose={() => {
            setIsModalOpen(false);
            dispatch(clearSelectedInvoice());
          }}
        />
      )}
    </div>
  );
}
