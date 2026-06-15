import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { generateInvoiceDataUri } from '../../lib/generateInvoicePDF';
import { mapOrderToInvoice } from '../../lib/invoiceMapper';

export function InvoiceModal({ invoice, pdfTitle, onClose, loading, onPrev, onNext, hasPrev, hasNext, currentIndex, totalItems, onDownloadAll }) {
  const [pdfUri, setPdfUri] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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

  useEffect(() => {
    if (invoice && invoice.invoice_orders && invoice.invoice_orders.length > 0) {
      const rawOrder = invoice.invoice_orders[0].order;
      if (rawOrder) {
        const mapped = mapOrderToInvoice(rawOrder, formatDate);
        const uri = generateInvoiceDataUri(mapped, pdfTitle);
        setPdfUri(uri);
      } else {
        setPdfUri(null);
      }
    } else {
      setPdfUri(null);
    }
  }, [invoice]);

  if (!invoice && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card-bg border border-border-subtle w-[98%] max-w-6xl h-[95vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-card-bg border-b border-border-subtle p-4 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-lg font-bold text-text-main truncate pr-4">
            Invoice Details #{invoice?.invoice_number}
            {totalItems > 1 && ` (${currentIndex + 1} of ${totalItems})`}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {totalItems > 1 && (
              <div className="flex items-center bg-dashboard-bg rounded-md p-0.5 mr-2">
                <button 
                  onClick={onPrev} 
                  disabled={!hasPrev} 
                  className="p-1 disabled:opacity-30 hover:bg-card-bg rounded text-text-main transition-colors"
                  title="Previous Invoice"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-2 text-xs font-semibold text-text-muted select-none">
                  {currentIndex + 1} / {totalItems}
                </div>
                <button 
                  onClick={onNext} 
                  disabled={!hasNext} 
                  className="p-1 disabled:opacity-30 hover:bg-card-bg rounded text-text-main transition-colors"
                  title="Next Invoice"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            <button onClick={() => {
              const filename = pdfTitle || `Invoice-${invoice?.invoice_number || 'invoice'}.pdf`;
              const a = document.createElement("a");
              a.href = pdfUri;
              a.download = filename;
              a.click();
            }} className="flex items-center gap-1 px-3 py-1.5 mr-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors" title="Download Invoice">
              <Download size={14} /> <span className="hidden sm:inline">Download</span>
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-dashboard-bg rounded-full text-text-muted">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100 p-2 overflow-hidden flex flex-col relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <div className="text-sm text-text-muted font-bold">Loading Invoice Data...</div>
              </div>
            </div>
          ) : pdfUri ? (
            <iframe 
              src={pdfUri} 
              className="w-full h-full rounded border-0 shadow-inner flex-1" 
              title="Invoice PDF Viewer" 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted font-bold">
              Failed to generate invoice preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
