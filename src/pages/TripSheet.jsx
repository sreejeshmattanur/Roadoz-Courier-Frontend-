import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Navigation, Trash2, Truck, Save,
    ChevronLeft, Loader2, ChevronDown, CheckCircle2,
    Search, Camera, Keyboard, MapPin, Building2, Map
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "../lib/utils";
import {
    fetchTripDriversApi, fetchTripVehiclesApi, fetchTripFranchisesApi,
    scanOrderForTripApi, createTripSheetApi, fetchTripSheetDetailsApi, updateTripSheetApi
} from "../services/apiCalls";

const KERALA_CITIES = [
    "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Malappuram",
    "Kannur", "Kollam", "Palakkad", "Alappuzha", "Kottayam", "Idukki",
    "Pathanamthitta", "Wayanad", "Kasaragod"
];

/**
 * Reusable Searchable Select Component
 */
const SearchableSelect = ({ label, options, value, onChange, placeholder, searchKey = "label" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    const filteredOptions = useMemo(() => {
        return options.filter(opt => opt[searchKey]?.toLowerCase().includes(search.toLowerCase()));
    }, [options, search, searchKey]);

    const selectedLabel = useMemo(() => {
        const found = options.find(opt => String(opt.id) === String(value));
        return found ? found[searchKey] : placeholder;
    }, [options, value, placeholder, searchKey]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-1.5 relative" ref={containerRef}>
            <label className="text-[10px] font-bold uppercase text-text-muted ml-1">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2.5 text-sm text-text-main flex justify-between items-center cursor-pointer hover:border-primary transition-all shadow-sm"
            >
                <span className={cn(!value && "text-text-muted")}>{selectedLabel}</span>
                <ChevronDown size={14} className={cn("text-text-muted transition-transform", isOpen && "rotate-180")} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-1 bg-card-bg border border-border-subtle rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
                    <div className="p-2 border-b border-border-subtle bg-dashboard-bg/50">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-card-bg border border-border-subtle rounded px-7 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar bg-card-bg">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }}
                                    className={cn(
                                        "px-3 py-2.5 text-xs text-text-main hover:bg-primary hover:text-black cursor-pointer border-b border-border-subtle/30 last:border-0",
                                        String(opt.id) === String(value) && "bg-primary/10 font-bold"
                                    )}
                                >
                                    {opt[searchKey]}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-text-muted text-[10px]">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function TripSheetForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [mastersLoading, setMastersLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [manualCode, setManualCode] = useState("");

    // Toggle for Hubs (Franchises) - Optional field enable/disable
    const [useHubs, setUseHubs] = useState(false);

    const [formData, setFormData] = useState({
        driver_id: "",
        vehicle_id: "",
        destination_franchise_id: null,
        route_franchise_ids: [],
        destination_city: "",
        route_city: [], // Multi-select array
        is_local: false,
        barcodes: [],
        scannedItems: []
    });

    const [masters, setMasters] = useState({ drivers: [], vehicles: [], franchises: [] });
    const hiddenInputRef = useRef(null);
    const html5QrCode = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                const [d, v, f] = await Promise.all([fetchTripDriversApi(), fetchTripVehiclesApi(), fetchTripFranchisesApi()]);

                setMasters({
                    drivers: d.map(i => ({ id: i.id, label: `${i.first_name} ${i.last_name} (${i.phone})` })),
                    vehicles: v.map(i => ({ id: i.id, label: `${i.plate_number} - ${i.model}` })),
                    franchises: f.map(i => ({ id: i.id, label: i.name }))
                });

                if (isEditMode) {
                    const trip = await fetchTripSheetDetailsApi(id);
                    const normalizedItems = (trip.orders || []).map(o => ({
                        order_number: o.order_number,
                        consignee: o.consignee,
                        payment_method: o.payment_method,
                        weight_summary: {
                            total_boxes: o.total_boxes || 0,
                            total_weight_kg: o.total_weight_kg || 0
                        }
                    }));

                    setFormData({
                        driver_id: trip.driver_id,
                        vehicle_id: trip.vehicle_id,
                        destination_franchise_id: trip.destination_franchise_id || null,
                        route_franchise_ids: trip.route_franchise_ids || [],
                        destination_city: trip.destination || "",
                        route_city: trip.route_city || [],
                        is_local: trip.is_local || false,
                        barcodes: normalizedItems.map(o => o.order_number),
                        scannedItems: normalizedItems
                    });

                    if (trip.destination_franchise_id || (trip.route_franchise_ids?.length > 0)) {
                        setUseHubs(true);
                    }
                }
            } catch (err) { toast.error("Initialization failed"); }
            finally { setMastersLoading(false); }
        };
        init();
    }, [id, isEditMode]);

    const processBarcode = async (code) => {
        const cleanCode = code?.trim().toUpperCase();
        if (!cleanCode) return;
        if (formData.barcodes.includes(cleanCode)) return toast.error("Already in list");

        const tid = toast.loading(`Scanning: ${cleanCode}`);
        try {
            const order = await scanOrderForTripApi(cleanCode);
            setFormData(p => ({
                ...p,
                barcodes: [...p.barcodes, cleanCode],
                scannedItems: [{
                    order_number: order.order_number,
                    consignee: order.consignee,
                    payment_method: order.payment_method,
                    weight_summary: order.weight_summary
                }, ...p.scannedItems]
            }));
            toast.success("Order Added", { id: tid });
            setManualCode("");
        } catch (err) { toast.error("Invalid Order", { id: tid }); }
    };

    const handleSave = async () => {
        if (!formData.driver_id || !formData.vehicle_id || !formData.destination_city || !formData.barcodes.length) {
            return toast.error("Missing Driver, Vehicle, City or Items");
        }

        setLoading(true);
        const payload = {
            driver_id: formData.driver_id,
            vehicle_id: formData.vehicle_id,
            destination_city: formData.destination_city,
            route_city: formData.route_city, // Sending the array of selected cities
            is_local: formData.is_local,
            barcodes: formData.barcodes,
            // Franchise data is optional based on toggle
            destination_franchise_id: useHubs ? formData.destination_franchise_id : null,
            route_franchise_ids: useHubs ? formData.route_franchise_ids : [],
        };

        try {
            if (isEditMode) await updateTripSheetApi(id, payload);
            else await createTripSheetApi(payload);
            toast.success("Manifest Saved");
            navigate("/dashboard/trip/trip-sheet");
        } catch (err) { toast.error("Save failed"); }
        finally { setLoading(false); }
    };

    const toggleCamera = async () => {
        if (isScanning) {
            if (html5QrCode.current) { await html5QrCode.current.stop(); html5QrCode.current = null; }
            setIsScanning(false);
        } else {
            setIsScanning(true);
            setTimeout(() => {
                html5QrCode.current = new Html5Qrcode("reader");
                html5QrCode.current.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => processBarcode(text))
                    .catch(() => setIsScanning(false));
            }, 100);
        }
    };

    if (mastersLoading) return <div className="h-screen flex items-center justify-center bg-dashboard-bg"><Loader2 className="animate-spin text-primary" size={40} /></div>;

    return (
        <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
            <input ref={hiddenInputRef} type="text" className="fixed -top-20 opacity-0" onKeyDown={(e) => { if (e.key === "Enter") { processBarcode(e.target.value); e.target.value = ""; } }} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0 text-text-muted hover:bg-primary hover:text-black"><ChevronLeft /></Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">{isEditMode ? "Edit Manifest" : "New Manifest"}</h1>
                        <p className="text-xs text-primary mt-1 font-medium flex items-center gap-1"><Truck size={12} /> Dispatch Unit</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-black font-bold h-11 px-8 rounded-xl shadow-lg">
                    {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> {isEditMode ? "Update" : "Save"} Manifest</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-4 space-y-6">
                    {/* CORE LOGISTICS */}
                    <Card className="bg-card-bg border-border-subtle rounded-2xl shadow-sm overflow-visible">
                        <div className="p-4 border-b border-border-subtle bg-dashboard-bg/50">
                            <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2"><Truck size={14} className="text-primary" /> Vehicle & Destination</h3>
                        </div>
                        <CardContent className="p-6 space-y-5">
                            <SearchableSelect label="Assign Driver *" placeholder="Search Driver" options={masters.drivers} value={formData.driver_id} onChange={(val) => setFormData({ ...formData, driver_id: val })} />
                            <SearchableSelect label="Assign Vehicle *" placeholder="Search Vehicle" options={masters.vehicles} value={formData.vehicle_id} onChange={(val) => setFormData({ ...formData, vehicle_id: val })} />


                        </CardContent>
                    </Card>

                    {/* ROUTING CARD */}
                    <Card className="bg-card-bg border-border-subtle rounded-2xl shadow-sm overflow-visible">
                        <div className="p-4 border-b border-border-subtle bg-dashboard-bg/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2"><Map size={14} className="text-primary" /> Route Planning</h3>
                        </div>

                        <CardContent className="p-6 space-y-6">
                            {/* MULTI-SELECT CITIES */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Route Cities (Multi-Select)</label>
                                <div className="bg-dashboard-bg border border-border-subtle rounded-md p-2 max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-1 gap-1">
                                    {KERALA_CITIES.map(city => (
                                        <div
                                            key={city}
                                            onClick={() => {
                                                const current = formData.route_city;
                                                const next = current.includes(city) ? current.filter(c => c !== city) : [...current, city];
                                                setFormData({ ...formData, route_city: next });
                                            }}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded text-[11px] cursor-pointer transition-all",
                                                formData.route_city.includes(city) ? "bg-primary text-black font-bold" : "text-text-muted hover:bg-card-bg"
                                            )}
                                        >
                                            <span>{city}</span>
                                            {formData.route_city.includes(city) && <CheckCircle2 size={12} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Destination City *</label>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        className="w-full bg-dashboard-bg border border-border-subtle rounded-md pl-9 pr-3 py-2.5 text-sm text-text-main focus:border-primary outline-none transition-all"
                                        placeholder="Enter target city..."
                                        value={formData.destination_city}
                                        onChange={(e) => setFormData({ ...formData, destination_city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <hr className="border-border-subtle/50" />

                            {/* FRANCHISE SECTION (OPTIONAL) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase text-text-muted flex items-center gap-2">
                                        <Building2 size={12} /> Hub Routing
                                    </label>
                                    <button
                                        onClick={() => setUseHubs(!useHubs)}
                                        className={cn("text-[9px] font-bold px-2 py-1 rounded border",
                                            useHubs ? "bg-primary/20 border-primary text-primary" : "bg-dashboard-bg border-border-subtle text-text-muted")}
                                    >
                                        {useHubs ? "ENABLED" : "ENABLE HUBS?"}
                                    </button>
                                </div>

                                {useHubs && (
                                    <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                                        <SearchableSelect
                                            label="Target Franchise Hub" placeholder="Select Hub"
                                            options={masters.franchises} value={formData.destination_franchise_id}
                                            onChange={(val) => setFormData({ ...formData, destination_franchise_id: val })}
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-text-muted ml-1">Franchise Stops</label>
                                            <div className="bg-dashboard-bg border border-border-subtle rounded-md p-2 max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                                {masters.franchises.map(f => (
                                                    <div key={f.id} onClick={() => {
                                                        const cur = formData.route_franchise_ids;
                                                        const next = cur.includes(f.id) ? cur.filter(id => id !== f.id) : [...cur, f.id];
                                                        setFormData({ ...formData, route_franchise_ids: next });
                                                    }} className={cn("flex items-center justify-between px-3 py-2 rounded text-[11px] cursor-pointer",
                                                        formData.route_franchise_ids.includes(f.id) ? "bg-primary/10 text-primary font-bold" : "text-text-muted hover:bg-card-bg")}>
                                                        <span>{f.label}</span>
                                                        {formData.route_franchise_ids.includes(f.id) && <CheckCircle2 size={12} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    {/* SCANNER CONTROLS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cn("p-4 rounded-xl border border-dashed flex flex-col gap-2 transition-colors", isScanning ? "border-red-500 bg-red-500/5" : "border-primary/40 bg-primary/5")}>
                            <div className="flex justify-between items-center">
                                <div className="text-xs font-bold uppercase flex items-center gap-2"><Camera size={14} /> Cam Scan</div>
                                <Button size="sm" onClick={toggleCamera} variant={isScanning ? "destructive" : "outline"} className="h-7 text-[10px] rounded-full px-4">{isScanning ? "Stop" : "Open Cam"}</Button>
                            </div>
                            {isScanning && <div id="reader" className="w-full rounded-lg overflow-hidden aspect-video bg-black shadow-inner"></div>}
                        </div>
                        <div className="p-4 bg-dashboard-bg/50 rounded-xl border border-border-subtle flex flex-col gap-3">
                            <div className="text-xs font-bold uppercase flex items-center gap-2"><Keyboard size={14} /> Manual Entry</div>
                            <div className="relative">
                                <input type="text" className="w-full bg-card-bg border border-border-subtle rounded-lg px-4 py-2.5 text-xs text-primary font-mono font-bold focus:border-primary outline-none" placeholder="Enter Order #" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") processBarcode(manualCode); }} />
                                <button onClick={() => processBarcode(manualCode)} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"><CheckCircle2 size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* MANIFEST TABLE */}
                    <Card className="bg-card-bg border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="p-4 border-b border-border-subtle bg-dashboard-bg/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">Loading Manifest ({formData.barcodes.length})</h3>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-dashboard-bg/30 border-b border-border-subtle text-[9px] font-bold uppercase text-text-muted">
                                    <tr><th className="py-4 px-6 text-left">LR Information</th><th className="py-4 px-6 text-left">Destination</th><th className="py-4 px-6 text-left">Stats</th><th className="py-4 px-6 text-right">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {formData.scannedItems.length > 0 ? formData.scannedItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-dashboard-bg/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="text-[13px] font-mono text-primary font-bold">{item.order_number}</div>
                                                <div className="text-[11px] text-text-muted uppercase">{item.consignee?.name || 'N/A'}</div>
                                            </td>
                                            <td className="py-4 px-6"><span className="text-[12px] font-bold text-text-main uppercase">{item.consignee?.city || 'N/A'}</span></td>
                                            <td className="py-4 px-6"><div className="text-[12px] font-black text-text-main">{(item.weight_summary?.total_boxes || 0)} Pkts</div></td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => setFormData(p => ({ ...p, barcodes: p.barcodes.filter(b => b !== item.order_number), scannedItems: p.scannedItems.filter(i => i.order_number !== item.order_number) }))} className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="py-24 text-center opacity-30 flex flex-col items-center gap-3 font-black text-[10px] uppercase"><Truck size={48} /> Manifest Empty</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {formData.scannedItems.length > 0 && (
                            <div className="p-6 bg-dashboard-bg/50 border-t border-border-subtle flex justify-between items-center">
                                <div className="text-right flex gap-8 ml-auto">
                                    <div><p className="text-[10px] text-text-muted font-bold uppercase">Total Pkts</p><p className="text-2xl font-black text-text-main">{formData.scannedItems.reduce((acc, curr) => acc + (curr.weight_summary?.total_boxes || 0), 0)}</p></div>
                                    <div><p className="text-[10px] text-text-muted font-bold uppercase">Total weight</p><p className="text-2xl font-black text-text-main">{formData.scannedItems.reduce((acc, curr) => acc + (curr.weight_summary?.total_weight_kg || 0), 0).toFixed(1)} <span className="text-xs">KG</span></p></div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}