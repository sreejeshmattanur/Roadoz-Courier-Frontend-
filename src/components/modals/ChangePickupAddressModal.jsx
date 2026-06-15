import React from "react";
import { X, MapPin } from "lucide-react";
import { Button } from "../ui/button";

export default function ChangePickupAddressModal({
  isOpen,
  onClose,
  pickupAddresses,
  selectedPickupAddress,
  setSelectedPickupAddress,
  pickupOrderIds,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-[95%] max-w-5xl bg-card-bg border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <div>
            <h2 className="text-2xl font-bold text-text-main">
              Change Pickup Address
            </h2>

            <p className="text-sm text-text-muted mt-1">
              Update selected orders pickup address
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:bg-dashboard-bg"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ORDER IDS */}
          <div>
            <label className="text-sm font-bold text-text-main block mb-2">
              Selected Order IDs
            </label>

            <div className="bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main">
              {pickupOrderIds.map((order) => order.order_number).join(", ")}
            </div>
          </div>

          {/* PICKUP LIST */}
          <div>
            <label className="text-sm font-bold text-text-main block mb-4">
              Choose Pickup Address
            </label>

            <div className="space-y-3">
              {pickupAddresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                    selectedPickupAddress === address.id
                      ? "border-primary bg-primary/5"
                      : "border-border-subtle hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="pickup-address"
                    checked={selectedPickupAddress === address.id}
                    onChange={() => setSelectedPickupAddress(address.id)}
                    className="mt-1 accent-primary"
                  />

                  <div>
                    <p className="text-sm font-bold text-text-main">
                      {address.nickname}
                    </p>

                    <p className="text-sm text-text-muted mt-1">
                      {address.contact_name} • {address.phone}
                    </p>

                    <p className="text-sm text-text-muted">
                      {address.address_line_1}, {address.city}, {address.state}{" "}
                      - {address.pincode}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-border-subtle bg-dashboard-bg/20">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>

          <Button
            onClick={onSubmit}
            className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl"
          >
            <MapPin size={16} className="mr-2" />
            Change Address
          </Button>
        </div>
      </div>
    </div>
  );
}
