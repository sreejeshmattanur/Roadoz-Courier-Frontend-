import React, { useEffect, useState } from "react";
import { X, User, Phone, Mail, Calendar, Landmark, FileText, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { fetchDriverByIdApi } from "../../services/apiCalls";
import { cn } from "../../lib/utils";

const BASE_URL = "http://api.roadozcourier.com"; // Adjust based on your environment

export default function DriverDetailsModal({ isOpen, onClose, driverId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && driverId) {
      loadDetails();
    }
  }, [isOpen, driverId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await fetchDriverByIdApi(driverId);
      setData(res);
    } catch (err) {
      console.error("Failed to load driver details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card-bg border border-border-subtle w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black font-black text-xl">
              {data?.first_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main uppercase tracking-tight">Driver Profile</h2>
              <p className="text-xs text-text-muted font-mono">{driverId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Fetching Personnel Files...</p>
            </div>
          ) : data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Personal Info */}
              <div className="md:col-span-1 space-y-6">
                <section>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Identity</h3>
                  <div className="space-y-4">
                    <InfoItem icon={<User size={14}/>} label="Full Name" value={`${data.first_name} ${data.last_name}`} />
                    <InfoItem icon={<Mail size={14}/>} label="Email" value={data.email} />
                    <InfoItem icon={<Phone size={14}/>} label="Phone" value={data.phone} />
                    <InfoItem icon={<Calendar size={14}/>} label="DOB" value={data.dob} />
                  </div>
                </section>

                <section className="pt-4 border-t border-border-subtle">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Status</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] text-text-muted font-bold">Onboarding</span>
                        <span className="text-[10px] font-black px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase">{data.onboarding_status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] text-text-muted font-bold">Registry</span>
                        <span className="text-[10px] font-black px-2 py-1 bg-green-500/10 text-green-500 rounded-lg uppercase">{data.status}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Bank & Documents */}
              <div className="md:col-span-2 space-y-8">
                {/* Bank Details */}
                <div className="bg-dashboard-bg/30 border border-border-subtle p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Landmark size={14} /> Payout Account
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InfoItem label="Bank Name" value={data.payout_account?.bank_name} />
                    <InfoItem label="Account Holder" value={data.payout_account?.account_holder_name} />
                    <InfoItem label="Account Number" value={data.payout_account?.account_number} isMono />
                    <InfoItem label="IFSC / Routing" value={data.payout_account?.ifsc_or_routing_code} isMono />
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <FileText size={14} /> Verification Documents
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.documents?.map((doc, idx) => (
                      <a 
                        key={idx} 
                        href={`${BASE_URL}${doc.path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 bg-card-bg border border-border-subtle rounded-xl hover:border-primary transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg"><FileText size={16}/></div>
                          <div>
                            <p className="text-[11px] font-bold text-text-main uppercase">{doc.document_type.replace('_', ' ')}</p>
                            <p className="text-[9px] text-text-muted truncate max-w-[120px]">{doc.original_filename}</p>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-text-muted group-hover:text-primary" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, isMono }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <span className={cn("text-[13px] font-bold text-text-main", isMono && "font-mono")}>
          {value || "---"}
        </span>
      </div>
    </div>
  );
}