import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Loader2, ExternalLink, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

export default function ConsigneeModal({
  isOpen,
  onClose,
  consigneeForm = {},
  handleConsigneeChange,
  handleSaveConsignee,
  loading,
  error,
  inputClass,
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState(null);

  if (!isOpen) return null;

  const handleAutoDetect = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lon: longitude });

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            
            if (data && data.address) {
              const a = data.address;
              
              const updates = {
                address_line_1: `${data.name || a.shop || ""} ${a.road ? (data.name ? ', ' : '') + a.road : ""}`.trim(),
                address_line_2: a.suburb || a.neighbourhood || a.county || "",
                pincode: a.postcode || "",
                city: a.city || a.town || a.village || "",
                state: a.state || "",
              };

              Object.entries(updates).forEach(([name, value]) => {
                handleConsigneeChange({ 
                  target: { name, value: value ? value.toString() : "" } 
                });
              });

              toast.success("Location auto-filled successfully!");
            }
          } catch (err) {
            toast.error("Failed to parse address details.");
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          toast.error("GPS access denied. Please enable location.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation not supported by browser.");
      setIsLocating(false);
    }
  };

  const fields = [
    { label: "Name*", name: "name", placeholder: "Consignee's Full Name" },
    { label: "Mobile*", name: "mobile", placeholder: "10-digit Mobile" },
    { label: "Alt Mobile", name: "alternate_mobile", placeholder: "Alternate Phone" },
    { label: "Email", name: "email", placeholder: "email@example.com", type: "email" },
    { label: "Address Line 1*", name: "address_line_1", placeholder: "Street/Building" },
    { label: "Address Line 2", name: "address_line_2", placeholder: "Landmark/Area" },
    { label: "Pincode*", name: "pincode", placeholder: "6-digit Pin" },
    { label: "City*", name: "city", placeholder: "City" },
    { label: "State*", name: "state", placeholder: "State" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card-bg border border-border-subtle rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-border-subtle bg-dashboard-bg/20">
          <h2 className="text-xl font-semibold text-text-main flex items-center gap-2">
            <User size={22} className="text-primary" /> Add Consignee Details
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="mb-6 space-y-2">
            <Button
              type="button"
              onClick={handleAutoDetect}
              disabled={isLocating}
              variant="outline"
              className="w-full border-dashed border-primary/40 text-primary gap-2 h-14 hover:bg-primary/5 transition-all"
            >
              {isLocating ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
              {isLocating ? "Fetching precise address..." : "Auto-Detect Address via GPS"}
            </Button>
            {coords && (
              <div className="flex justify-center items-center gap-2 text-[10px] text-text-muted">
                <span>Lat: {coords.lat.toFixed(4)}, Lon: {coords.lon.toFixed(4)}</span>
                <a href={`https://www.google.com/maps?q=${coords.lat},${coords.lon}`} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={10} /> View Map
                </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((f) => (
              <div key={f.name} className={f.name.includes("address") ? "md:col-span-2 space-y-1" : "space-y-1"}>
                <label className="text-[10px] uppercase font-bold text-text-muted ml-1">{f.label}</label>
                <input
                  type={f.type || "text"}
                  name={f.name}
                  value={consigneeForm[f.name] || ""}
                  onChange={handleConsigneeChange}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-border-subtle flex justify-end gap-4 bg-dashboard-bg/20">
          <button onClick={onClose} className="text-sm px-6 py-2.5 text-text-muted">Cancel</button>
          <Button
            onClick={handleSaveConsignee}
            disabled={loading}
            className="bg-primary text-black px-10 py-2.5 rounded-lg font-bold shadow-lg"
          >
            {loading ? "Saving..." : "Save Consignee"}
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
