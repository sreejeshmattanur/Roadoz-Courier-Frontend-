import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, Eye, Loader2, Calendar, RotateCcw } from "lucide-react";
import { generateInvoicePDF } from "../lib/generateInvoicePDF";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import {
  fetchInvoices,
  fetchInvoiceDetail,
  clearSelectedInvoice,
} from "../redux/invoiceSlice";
import { InvoiceModal } from "../components/common/InvoiceModal";

export function Invoices() {
  const dispatch = useDispatch();
  const { items, pagination, loading, selectedInvoice, detailLoading } =
    useSelector((state) => state.invoices);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    orderNumber: "",
  });

  // Frontend filtering
  const filteredItems = items.filter((inv) => {
    // Date filter
    if (filters.startDate || filters.endDate) {
      const invoiceDate = new Date(inv.created_at);
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        if (invoiceDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (invoiceDate > end) return false;
      }
    }
    
    // Order number filter
    const orderNumber = inv.invoice_orders?.[0]?.order?.order_number;
    if (filters.orderNumber && !orderNumber?.toLowerCase().includes(filters.orderNumber.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  useEffect(() => {
    dispatch(fetchInvoices({ page: 1, limit: 1000 }));
  }, [dispatch]);

  const handleApplyFilters = () => {
    // Filters are applied automatically via filteredItems
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      orderNumber: "",
    });
  };

  const handleViewDetails = (id) => {
    dispatch(fetchInvoiceDetail(id));
    setIsModalOpen(true);
  };

  const handleDownloadPDF = (invoice) => {
    const orderData = invoice.invoice_orders?.[0]?.order;
    const pickupAddress = orderData?.pickup_address;
    const consignee = orderData?.consignee;
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' pm';
    };

    // Format currency
    const formatCurrency = (amount) => {
      return Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    };

    // Map to generateInvoicePDF format
    const mappedOrder = {
      invoiceNo: invoice.invoice_number,
      created: formatDate(invoice.created_at),
      awb: 'AWB_PENDING',
      id: orderData?.order_number || 'N/A',
      pickup: {
        name: pickupAddress?.contact_name || '',
        address1: pickupAddress?.address_line_1 || '',
        address2: pickupAddress?.address_line_2 || '',
        city: `${pickupAddress?.city || ''}, ${pickupAddress?.state || ''} - ${pickupAddress?.pincode || ''}`,
        phone: pickupAddress?.phone || ''
      },
      customer: {
        name: consignee?.name || '',
        address1: consignee?.address_line_1 || '',
        address2: consignee?.address_line_2 || '',
        city: `${consignee?.city || ''}, ${consignee?.state || ''} - ${consignee?.pincode || ''}`,
        phone: consignee?.mobile || ''
      },
      product: {
        name: orderData?.order_value ? 'Package' : 'N/A',
        sku: 'PKG001',
        qty: 1,
        value: formatCurrency(orderData?.order_value)
      },
      weight: '10 KG',
      dims: '10 x 20 x 30 cm',
      charges: {
        freight: formatCurrency(invoice.invoice_orders?.[0]?.base_freight),
        fuel: formatCurrency(invoice.invoice_orders?.[0]?.fuel_surcharge),
        handling: '40.00',
        insurance: '15.00',
        subtotal: formatCurrency(invoice.subtotal),
        gst: formatCurrency(invoice.tax_amount)
      },
      payment: {
        method: orderData?.payment_method || 'N/A',
        total: formatCurrency(invoice.total_amount)
      },
      shipmentType: orderData?.order_type || 'N/A',
      riskType: 'owner_risk',
      totalBoxes: 1
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
    const rows = items.map((inv) => [
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Invoices</h1>
        <p className="text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">
            Dashboard
          </Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> Invoices
        </p>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-main">
              Invoices (Showing {filteredItems.length} Out Of {items.length})
            </h2>
            <Button
              onClick={handleExportCSV}
              className="bg-primary text-black h-9 px-4 text-xs font-bold rounded-md flex items-center gap-2"
            >
              <Download size={14} /> Export CSV
            </Button>
          </div>

          {/* Filters Section */}
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
                  Order Number
                </label>
                <input
                  type="text"
                  value={filters.orderNumber}
                  onChange={(e) =>
                    setFilters({ ...filters, orderNumber: e.target.value })
                  }
                  placeholder="Order #"
                  className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              <div className="self-end">
                <Button
                  onClick={handleClearFilters}
                  className="bg-primary text-black hover:bg-primary/90 h-[34px] text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Clear Filters
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase border-b border-border-subtle whitespace-nowrap">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">Tax</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredItems.length > 0 ? (
                  filteredItems.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-dashboard-bg/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-text-main">
                        {inv.invoice_number}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-text-muted max-w-xs truncate"
                        title={inv.description}
                      >
                        {inv.description
                          ? inv.description.split(/ from /i)[0].trim()
                          : ""}
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
                        {inv.created_at
                          ? new Date(inv.created_at).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(inv.id)}
                            title="View Details"
                            className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(inv)}
                            title="Download PDF"
                            className="p-1.5 bg-primary text-black rounded-md shadow-sm transition-transform active:scale-95 hover:bg-primary/90"
                          >
                            <Download size={14} />
                          </button>
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
                      {items.length === 0 ? "No invoices found." : "No invoices match the filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination hidden for frontend filtering */}
        </CardContent>
      </Card>

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
