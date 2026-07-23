import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Calendar, Tag, Info, Hash, Palette, Loader2 } from "lucide-react";
import { fetchVehicleByIdApi } from "../../services/apiCalls";

export default function VehicleDetailsModal({ isOpen, onClose, vehicleId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && vehicleId) {
      loadDetails();
    }
  }, [isOpen, vehicleId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await fetchVehicleByIdApi(vehicleId);
      setData(res);
    } catch (err) {
      console.error("Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card-bg border border-border-subtle w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20">
                <Truck size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Asset Specifications</h2>
                <p className="text-[10px] text-primary font-bold tracking-[0.3em] uppercase">Fleet Identification System</p>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-dashboard-bg border border-border-subtle rounded-2xl text-text-muted hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-10">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Accessing Registry...</p>
              </div>
            ) : data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Identity Section */}
                <div className="space-y-6">
                  <SectionTitle title="Primary Identity" />
                  <DetailItem icon={<Hash />} label="Plate Number" value={data.plate_number} isPrimary />
                  <DetailItem icon={<Tag />} label="Vehicle Type" value={data.type} isCaps />
                  <DetailItem icon={<Info />} label="Current Status" value={data.status} isStatus />
                </div>

                {/* Technical Specs */}
                <div className="space-y-6">
                  <SectionTitle title="Technical Specifications" />
                  <DetailItem icon={<Truck />} label="Make & Brand" value={data.make} />
                  <DetailItem icon={<Tag />} label="Model Name" value={data.model} />
                  <DetailItem icon={<Calendar />} label="Manufacturing Year" value={data.year} />
                  <DetailItem icon={<Palette />} label="Body Color" value={data.color} />
                </div>
                
                {/* System Info */}
                <div className="md:col-span-2 pt-6 border-t border-border-subtle flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase">Internal ID</p>
                        <p className="text-[11px] font-mono text-text-main opacity-50">{data.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-text-muted uppercase">Linked Franchise</p>
                        <p className="text-[11px] font-bold text-primary">{data.franchise_id || "UNASSIGNED / CENTRAL"}</p>
                    </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const SectionTitle = ({ title }) => (
    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 border-l-2 border-primary pl-2">{title}</p>
);

const DetailItem = ({ icon, label, value, isPrimary, isCaps, isStatus }) => (
  <div className="flex items-start gap-3 group">
    <div className="mt-1 text-primary group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 16 })}
    </div>
    <div>
      <p className="text-[9px] font-bold text-text-muted uppercase mb-0.5">{label}</p>
      <p className={cn(
        "text-sm font-bold tracking-tight",
        isPrimary ? "text-primary font-mono text-lg" : "text-text-main",
        isCaps && "uppercase",
        isStatus && "inline-block px-3 py-0.5 rounded-full bg-primary/10 text-[10px] border border-primary/20 uppercase"
      )}>
        {value || "---"}
      </p>
    </div>
  </div>
);

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}