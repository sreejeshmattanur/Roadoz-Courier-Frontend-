import Barcode from "react-barcode";

import {
  X,
  User,
  MapPin,
  Package,
  Truck,
  RotateCcw,
} from "lucide-react";

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
}) {
  if (!isOpen || !order) return null;

  const InfoField = ({ label, value }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
        {label}
      </p>

      <p className="text-sm font-semibold text-text-main">
        {value || "N/A"}
      </p>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 pb-2 border-b border-border-subtle mb-4 mt-6 first:mt-0">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <Icon size={16} />
      </div>

      <h3 className="text-xs font-bold text-text-main uppercase tracking-tighter">
        {title}
      </h3>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="w-[95%] max-w-5xl bg-card-bg rounded-2xl shadow-xl border border-border-subtle overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-bold text-text-main">
            Order Details — #{order.id}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dashboard-bg transition-colors"
          >
            <X className="text-text-muted" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          <div className="bg-dashboard-bg p-6 rounded-2xl border border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6">

            <div>
              <h2 className="text-lg font-bold text-text-main">
                {order.customer?.name}
              </h2>

              <p className="text-[10px] text-primary font-bold mt-1 uppercase">
                ORDER ID: {order.id}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-border-subtle shadow-sm flex flex-col items-center">

              <Barcode
                value={order.order_number || order.id || "NO-DATA"}
                width={1.8}
                height={60}
                fontSize={14}
                margin={0}
                displayValue={true}
                background="#ffffff"
                lineColor="#000000"
              />

              {/* API BARCODE IMAGE */}
              {order?.barcode && (
                <img
                  src={`data:image/png;base64,${order.barcode}`}
                  alt="barcode"
                  className="mt-4 w-[220px] object-contain"
                />
              )}
            </div>

            <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
              {order.status}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 px-2">

            <div className="md:col-span-2">
              <SectionHeader
                icon={User}
                title="Customer Info"
              />
            </div>

            <InfoField
              label="Name"
              value={order.customer?.name}
            />

            <InfoField
              label="Phone"
              value={order.customer?.phone}
            />

            <InfoField
              label="Order Date"
              value={order.customer?.date}
            />

            <div className="md:col-span-2">
              <SectionHeader
                icon={MapPin}
                title="Route Details"
              />
            </div>

            <InfoField
              label="From"
              value={`${order.route?.from} (${order.route?.fromPin})`}
            />

            <InfoField
              label="To"
              value={`${order.route?.to} (${order.route?.toPin})`}
            />

            <div className="md:col-span-2">
              <SectionHeader
                icon={Package}
                title="Product Details"
              />
            </div>

            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div
                  key={index}
                  className="md:col-span-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">

                    <InfoField
                      label="Product"
                      value={item.product_name}
                    />

                    <InfoField
                      label="SKU"
                      value={item.sku}
                    />

                    <InfoField
                      label="Quantity"
                      value={item.qty}
                    />

                    <InfoField
                      label="Unit Price"
                      value={`₹${item.unit_price}`}
                    />

                    <InfoField
                      label="Total"
                      value={`₹${item.total}`}
                    />
                  </div>

                  {index !== order.items.length - 1 && (
                    <div className="border-b border-border-subtle my-3" />
                  )}
                </div>
              ))
            ) : (
              <div className="md:col-span-2 text-xs text-text-muted">
                No products found
              </div>
            )}

            <div className="md:col-span-2">
              <SectionHeader
                icon={Package}
                title="Weight & Dimensions"
              />
            </div>

            <InfoField
              label="Weight"
              value={order.weight}
            />

            <InfoField
              label="Dimensions"
              value={order.dims}
            />

            <div className="md:col-span-2">
              <SectionHeader
                icon={Truck}
                title="Shipment Details"
              />
            </div>

            <InfoField
              label="Shipment ID"
              value={order.shipment?.id}
            />

            <InfoField
              label="Courier"
              value={order.shipment?.courier}
            />

            <InfoField
              label="Payment Method"
              value={order.payment?.method}
            />

            <InfoField
              label="Amount"
              value={order.payment?.total}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-subtle">
          <div className="h-[32px]"></div>
        </div>


      </div>
    </div>
  );
}