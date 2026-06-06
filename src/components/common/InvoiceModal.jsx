import React from 'react';
import { X } from 'lucide-react';

export function InvoiceModal({ invoice, onClose, loading }) {
  if (!invoice && !loading) return null;

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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Rs. 0.00';
    return `Rs. ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get the first invoice order for detailed display
  const invoiceOrder = invoice?.invoice_orders?.[0];
  const order = invoiceOrder?.order;
  const pickupAddress = order?.pickup_address;
  const consignee = order?.consignee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold text-gray-800">Invoice Details #{invoice?.invoice_number}</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-blue-600 font-bold">Loading Invoice Data...</div>
        ) : (
          <div id="printable-invoice" className="p-8 text-gray-900 bg-white font-sans">
            {/* Header Section */}
            <div className="text-right mb-8">
              <h2 className="text-xl font-bold text-black mb-3">TAX INVOICE</h2>
              <table className="text-xs text-left ml-auto">
                <tbody>
                  <tr>
                    <td className="font-semibold pr-4 py-0.5">Invoice No:</td>
                    <td className="py-0.5">{invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-4 py-0.5">Invoice Date:</td>
                    <td className="py-0.5">{formatDate(invoice.created_at)}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold pr-4 py-0.5">Order Number:</td>
                    <td className="py-0.5">{order?.order_number || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <hr className="border-gray-400 my-4" />

            {/* Pickup and Delivery Addresses */}
            <div className="grid grid-cols-2 mb-6">
              {/* Pickup Address */}
              <div className="pr-8 border-r border-gray-300">
                <h3 className="font-bold text-black mb-2 text-sm">Pickup Address</h3>
                <div className="text-xs text-gray-800 space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-black">{pickupAddress?.contact_name || '-'}</p>
                  <p>{pickupAddress?.address_line_1 || '-'}</p>
                  {pickupAddress?.address_line_2 && <p>{pickupAddress.address_line_2}</p>}
                  <p>{pickupAddress?.city || '-'}, {pickupAddress?.state || '-'} - {pickupAddress?.pincode || '-'}</p>
                  <p className="mt-1"><span className="font-semibold">Phone:</span> {pickupAddress?.phone || '-'}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="pl-8">
                <h3 className="font-bold text-black mb-2 text-sm">Delivery Address</h3>
                <div className="text-xs text-gray-800 space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-black">{consignee?.name || '-'}</p>
                  <p>{consignee?.address_line_1 || '-'}</p>
                  {consignee?.address_line_2 && <p>{consignee.address_line_2}</p>}
                  <p>{consignee?.city || '-'}, {consignee?.state || '-'} - {consignee?.pincode || '-'}</p>
                  <p className="mt-1"><span className="font-semibold">Phone:</span> {consignee?.mobile || '-'}</p>
                </div>
              </div>
            </div>

            <hr className="border-gray-400 my-4" />

            {/* Shipment Details */}
            <h3 className="font-bold text-black mb-3 text-sm">Shipment Details</h3>
            <table className="w-full mb-6 border border-gray-300 text-xs border-collapse">
              <thead className="bg-black text-white">
                <tr className="text-left">
                  <th className="py-2 px-3 border border-gray-300 font-semibold">Product</th>
                  <th className="py-2 px-3 border border-gray-300 font-semibold">SKU</th>
                  <th className="py-2 px-3 border border-gray-300 font-semibold">Qty</th>
                  <th className="py-2 px-3 border border-gray-300 font-semibold">Weight</th>
                  <th className="py-2 px-3 border border-gray-300 font-semibold">Dimensions</th>
                  <th className="py-2 px-3 border border-gray-300 font-semibold text-right">Declared Value</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                <tr>
                  <td className="py-3 px-3 border border-gray-300">{order?.product_name || '-'}</td>
                  <td className="py-3 px-3 border border-gray-300">{order?.product_sku || '-'}</td>
                  <td className="py-3 px-3 border border-gray-300">{order?.product_quantity || '-'}</td>
                  <td className="py-3 px-3 border border-gray-300">{order?.weight ? `${order.weight} KG` : '-'}</td>
                  <td className="py-3 px-3 border border-gray-300">{order?.dimensions || '-'}</td>
                  <td className="py-3 px-3 border border-gray-300 text-right">{formatCurrency(order?.order_value)}</td>
                </tr>
              </tbody>
            </table>

            {/* Charges Breakdown */}
            <h3 className="font-bold text-black mb-3 text-sm">Charges Breakdown</h3>
            <table className="w-full mb-6 border border-gray-300 text-xs border-collapse">
              <thead className="bg-black text-white">
                <tr className="text-left">
                  <th className="py-2 px-3 border border-gray-300 font-semibold">Description</th>
                  <th className="py-2 px-3 border border-gray-300 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                <tr>
                  <td className="py-2 px-3 border border-gray-300">Freight Charges</td>
                  <td className="py-2 px-3 border border-gray-300 text-right">{invoiceOrder?.base_freight ? formatCurrency(invoiceOrder.base_freight) : '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-gray-300">Fuel Surcharge</td>
                  <td className="py-2 px-3 border border-gray-300 text-right">{invoiceOrder?.fuel_surcharge ? formatCurrency(invoiceOrder.fuel_surcharge) : '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-gray-300">Handling Charges</td>
                  <td className="py-2 px-3 border border-gray-300 text-right">{invoiceOrder?.handling_charges ? formatCurrency(invoiceOrder.handling_charges) : '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-gray-300">Insurance Charges</td>
                  <td className="py-2 px-3 border border-gray-300 text-right">{invoiceOrder?.insurance_charges ? formatCurrency(invoiceOrder.insurance_charges) : '-'}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2 px-3 border border-gray-300">Subtotal</td>
                  <td className="py-2 px-3 border border-gray-300 text-right">{invoice.subtotal ? formatCurrency(invoice.subtotal) : '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-gray-300">GST @ 18%</td>
                  <td className="py-2 px-3 border border-gray-300 text-right">{invoice.tax_amount ? formatCurrency(invoice.tax_amount) : '-'}</td>
                </tr>
                <tr className="font-bold bg-gray-200">
                  <td className="py-3 px-3 border border-gray-300">Grand Total</td>
                  <td className="py-3 px-3 border border-gray-300 text-right">{invoice.total_amount ? formatCurrency(invoice.total_amount) : '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Payment and Shipment Info Box */}
            <div className="mb-4 border border-gray-300 text-xs">
              <div className="grid grid-cols-3">
                <div className="p-3 border-r border-gray-300">
                  <span className="font-semibold">Payment Method:</span>
                  <span className="ml-1">{order?.payment_method || '-'}</span>
                </div>
                <div className="p-3 border-r border-gray-300 text-center">
                  <span className="font-semibold">Shipment Type:</span>
                  <span className="ml-1">{order?.order_type || '-'}</span>
                </div>
                <div className="p-3 text-right">
                  <span className="font-semibold">Risk Type:</span>
                  <span className="ml-1">owner_risk</span>
                </div>
              </div>
            </div>

            {/* Total Boxes */}
            <div className="mb-4 text-xs">
              <span className="font-semibold">Total Boxes:</span>
              <span className="ml-2">1</span>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-8 text-xs text-gray-800">
              <p className="font-bold text-black mb-1">Terms & Conditions:</p>
              <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                <li>All shipments are subject to Roadoz Logistics standard terms of carriage.</li>
                <li>Misdeclaration of goods may result in penalties or shipment rejection.</li>
                <li>Prohibited items, hazardous materials, and contraband are not accepted for transport.</li>
                <li>Maximum liability for loss or damage is limited to the declared value or Rs. 100 per kg, whichever is lower.</li>
                <li>Damaged or lost shipment claims must be reported within 48 hours of delivery.</li>
                <li>Undelivered shipments will be held for 30 days before disposal.</li>
                <li>Freight charges are non-refundable once shipment is dispatched.</li>
                <li>GST is applicable as per Indian taxation laws and will be charged extra.</li>
              </ol>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-t border-gray-400 pt-2 mt-16 w-64">
                  <p className="text-xs text-gray-800">Customer Signature</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="border-t border-gray-400 pt-2 mt-16 w-64">
                  <p className="text-xs text-gray-800">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}