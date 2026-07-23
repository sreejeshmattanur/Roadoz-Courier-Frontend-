import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Save, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { createVehicleApi, updateVehicleApi, fetchVehicleByIdApi } from "../../services/apiCalls";
import { toast } from "react-hot-toast";

export default function VehicleModal({ isOpen, onClose, editData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: "",
    make: "",
    model: "",
    type: "",
    year: new Date().getFullYear().toString(),
    color: "",
    status: "available"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData?.id) {
        loadDetails(editData.id);
      } else {
        setFormData({
          plate_number: "", make: "", model: "", type: "",
          year: new Date().getFullYear().toString(), color: "", status: "available"
        });
      }
    }
  }, [editData, isOpen]);

  const loadDetails = async (id) => {
    setFetching(true);
    try {
      const data = await fetchVehicleByIdApi(id);
      setFormData({
        plate_number: data.plate_number || "",
        make: data.make || "",
        model: data.model || "",
        type: data.type || "",
        year: data.year || "",
        color: data.color || "",
        status: data.status || "available"
      });
    } catch (err) {
      toast.error("Failed to load vehicle details");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editData) {
        await updateVehicleApi(editData.id, formData);
        toast.success("Vehicle updated successfully");
      } else {
        await createVehicleApi(formData);
        toast.success("Vehicle added to fleet");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
          className="bg-card-bg rounded-[2rem] w-full max-w-xl border border-border-subtle overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">
                  {editData ? "Update Assets" : "Fleet Registration"}
                </h3>
                <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Vehicle Master Entry</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-text-muted transition-colors"><X size={20} /></button>
          </div>

          <div className="p-8">
            {fetching ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-[10px] font-bold text-text-muted uppercase">Fetching Vehicle Data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Registration / Plate Number</label>
                    <input
                      required className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-primary font-mono font-bold focus:border-primary outline-none"
                      placeholder="e.g. KL-01-AZ-1234"
                      value={formData.plate_number}
                      onChange={(e) => setFormData({...formData, plate_number: e.target.value.toUpperCase()})}
                    />
                  </div>

                  <FormInput label="Make" value={formData.make} onChange={v => setFormData({...formData, make: v})} placeholder="e.g. Tata" />
                  <FormInput label="Model" value={formData.model} onChange={v => setFormData({...formData, model: v})} placeholder="e.g. 407" />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Vehicle Type</label>
                    <select
                      required className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary appearance-none"
                      value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="container">Container</option>
                      <option value="bike">Two Wheeler</option>
                    </select>
                  </div>

                  <FormInput label="Manufacturing Year" type="number" value={formData.year} onChange={v => setFormData({...formData, year: v})} />
                  <FormInput label="Body Color" value={formData.color} onChange={v => setFormData({...formData, color: v})} />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Asset Status</label>
                    <select
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary appearance-none"
                      value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="available">Available</option>
                      <option value="busy">On Trip</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <Button disabled={loading} className="w-full bg-primary text-black font-black h-14 rounded-2xl shadow-xl hover:shadow-primary/20 uppercase tracking-widest mt-4">
                  {loading ? <Loader2 className="animate-spin" /> : editData ? "Update Registry" : "Register Vehicle"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function FormInput({ label, value, onChange, type="text", placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase text-text-muted ml-1">{label}</label>
      <input
        type={type} required placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
      />
    </div>
  );
}