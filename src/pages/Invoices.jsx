import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, Eye, Loader2 } from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import { fetchInvoices, fetchInvoiceDetail, clearSelectedInvoice } from "../redux/invoiceSlice";
import { InvoiceModal } from "../components/common/InvoiceModal";

export function Invoices() {
  const dispatch = useDispatch();
  const { items, pagination, loading, selectedInvoice, detailLoading } = useSelector((state) => state.invoices);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices({ page: 1, limit: 25 }));
  }, [dispatch]);

  const handleViewDetails = (id) => {
    dispatch(fetchInvoiceDetail(id));
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ["Invoice #", "Description", "Orders", "Subtotal", "Tax", "Total Amount", "Status"];
    const rows = items.map(inv => [
      inv.invoice_number,
      `"${inv.description}"`,
      inv.orders_count,
      inv.subtotal,
      inv.tax_amount,
      inv.total_amount,
      inv.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
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
          <Link to="/" className="hover:underline">Dashboard</Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> Invoices
        </p>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-main">
              Invoices (Showing {items.length} Out Of {pagination.total})
            </h2>
            <Button onClick={handleExportCSV} className="bg-primary text-black h-9 px-4 text-xs font-bold rounded-md flex items-center gap-2">
              <Download size={14} /> Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase border-b border-border-subtle">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">Tax</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.length > 0 ? items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-dashboard-bg/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-text-main">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">{inv.description}</td>
                    <td className="px-6 py-4 text-sm text-text-main">{inv.orders_count}</td>
                    <td className="px-6 py-4 text-sm text-text-main">₹ {inv.subtotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-text-main">₹ {inv.tax_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-text-main">₹ {inv.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                           onClick={() => handleViewDetails(inv.id)}
                           title="View Details"
                           className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-text-muted italic">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(p) => dispatch(fetchInvoices({ page: p, limit: 25 }))}
          />
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