import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    Navigation, Plus, Search, Trash2, Scan, Maximize, StopCircle, 
    Truck, User, MapPin, CheckCircle2, Loader2, Eye, X, ChevronRight, LayoutList
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import { getTripMasters, getTripSheets } from "../redux/tripSlice";
import { scanOrderForTripApi, createTripSheetApi, fetchTripSheetDetailsApi, deleteTripSheetApi } from "../services/apiCalls";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

const KERALA_CITIES = ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Malappuram", "Kannur", "Kollam", "Palakkad", "Alappuzha", "Kottayam"];

export default function TripSheet() {
    const dispatch = useDispatch();
    const { drivers, vehicles, franchises, tripSheets, loading } = useSelector((state) => state.trip);

    // Local UI State
    const [view, setView] = useState("list"); // list | create
    const [selectedTripDetails, setSelectedTripDetails] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    
    // Search Filters
    const [driverSearch, setDriverSearch] = useState("");
    const [vehicleSearch, setVehicleSearch] = useState("");

    // Form State for Creation
    const [formData, setFormData] = useState({
        driver_id: "",
        vehicle_id: "",
        destination_franchise_id: "",
        route_franchise_ids: [],
        destination_city: "",
        is_local: false,
        barcodes: [],
        scannedItems: [] // Full order objects for the table
    });

    const scannerRef = useRef(null);
    const hiddenInputRef = useRef(null);
    const processingRef = useRef(false);

    useEffect(() => {
        dispatch(getTripMasters());
        dispatch(getTripSheets({ page: 1, limit: 10 }));
    }, [dispatch]);

    // Keep USB scanner focused
    useEffect(() => {
        const interval = setInterval(() => {
            if (view === "create" && hiddenInputRef.current && 
                !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
                hiddenInputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [view]);

    // --- SCAN LOGIC ---
    const handleAddOrder = async (barcode) => {
        if (formData.barcodes.includes(barcode)) return toast.error("Already in list");
        if (processingRef.current) return;

        processingRef.current = true;
        const tid = toast.loading(`Fetching ${barcode}...`);
        try {
            const order = await scanOrderForTripApi(barcode);
            setFormData(prev => ({
                ...prev,
                barcodes: [...prev.barcodes, barcode],
                scannedItems: [order, ...prev.scannedItems]
            }));
            toast.success(`${barcode} added`, { id: tid });
        } catch (err) {
            toast.error("Invalid Barcode", { id: tid });
        } finally {
            processingRef.current = false;
        }
    };

    const toggleCamera = async () => {
        if (isScanning) {
            if (scannerRef.current) await scannerRef.current.stop();
            setIsScanning(false);
            return;
        }
        setIsScanning(true);
        setTimeout(async () => {
            const html5QrCode = new Html5Qrcode("trip-scan-region");
            scannerRef.current = html5QrCode;
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => handleAddOrder(text.trim()));
        }, 300);
    };

    // --- FORM ACTIONS ---
    const submitTripSheet = async () => {
        if (!formData.driver_id || !formData.vehicle_id || formData.barcodes.length === 0) {
            return toast.error("Select Driver, Vehicle and scan orders");
        }

        try {
            const payload = {
                ...formData,
                route: formData.route_franchise_ids.map(id => franchises.find(f => f.id === id)?.name || ""),
                destination: formData.destination_city || "Main Hub"
            };
            delete payload.scannedItems; // Clean for API

            await createTripSheetApi(payload);
            toast.success("Trip Sheet Saved!");
            setView("list");
            dispatch(getTripSheets({ page: 1, limit: 10 }));
            setFormData({ driver_id: "", vehicle_id: "", destination_franchise_id: "", route_franchise_ids: [], destination_city: "", is_local: false, barcodes: [], scannedItems: [] });
        } catch (err) {
            toast.error("Save Failed");
        }
    };

    // --- FILTERED DATA ---
    const filteredDrivers = drivers.filter(d => 
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(driverSearch.toLowerCase()) || d.phone.includes(driverSearch)
    );
    const filteredVehicles = vehicles.filter(v => 
        v.plate_number.toLowerCase().includes(vehicleSearch.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 bg-[#09090b] min-h-screen text-white space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 italic">
                        <Navigation className="text-primary" size={32} /> TRIP OPERATIONS
                    </h1>
                    <div className="flex gap-4 mt-2">
                        <div className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded font-bold uppercase text-gray-500">
                            Drivers: {drivers.length}
                        </div>
                        <div className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded font-bold uppercase text-gray-500">
                            Vehicles: {vehicles.length}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => setView("list")} className={cn("px-6 py-2 rounded-xl text-xs font-bold transition-all", view === "list" ? "bg-primary text-black" : "text-gray-400 hover:text-white")}>Log</button>
                    <button onClick={() => setView("create")} className={cn("px-6 py-2 rounded-xl text-xs font-bold transition-all", view === "create" ? "bg-primary text-black" : "text-gray-400 hover:text-white")}>Create Trip</button>
                </div>
            </div>

            {view === "create" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CONFIG SIDEBAR */}
                    <Card className="lg:col-span-4 bg-[#121212] border-white/10 rounded-3xl overflow-hidden">
                        <CardContent className="p-6 space-y-5">
                            <h2 className="text-sm font-bold text-primary uppercase">1. Vehicle & Route</h2>
                            
                            {/* Driver Search & Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Driver Selection</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                                    <input 
                                        placeholder="Search Driver..."
                                        className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
                                        value={driverSearch}
                                        onChange={(e) => setDriverSearch(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                                    value={formData.driver_id}
                                    onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                                >
                                    <option value="">Select Result ({filteredDrivers.length})</option>
                                    {filteredDrivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.phone})</option>)}
                                </select>
                            </div>

                            {/* Vehicle Search & Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Vehicle Selection</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                                    <input 
                                        placeholder="Search Plate No..."
                                        className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
                                        value={vehicleSearch}
                                        onChange={(e) => setVehicleSearch(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                                    value={formData.vehicle_id}
                                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                                >
                                    <option value="">Select Result ({filteredVehicles.length})</option>
                                    {filteredVehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} - {v.make}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Kerala City</label>
                                    <select className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" value={formData.destination_city} onChange={e => setFormData({...formData, destination_city: e.target.value})}>
                                        <option value="">Select City</option>
                                        {KERALA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Local Mode</label>
                                    <button 
                                        onClick={() => setFormData({...formData, is_local: !formData.is_local})}
                                        className={cn("w-full h-10 rounded-xl font-bold text-xs border transition-all", formData.is_local ? "bg-primary border-primary text-black" : "border-white/10 text-gray-500")}
                                    >
                                        {formData.is_local ? "ON" : "OFF"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Target Hub</label>
                                <select className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm" value={formData.destination_franchise_id} onChange={e => setFormData({...formData, destination_franchise_id: e.target.value})}>
                                    <option value="">Select Destination Hub</option>
                                    {franchises.map(f => <option key={f.id} value={f.id}>{f.name} ({f.proposed_location})</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Route Via (Multi-Select)</label>
                                <select multiple className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm h-32 custom-scrollbar" value={formData.route_franchise_ids} onChange={e => {
                                    const options = Array.from(e.target.selectedOptions, o => o.value);
                                    setFormData({...formData, route_franchise_ids: options});
                                }}>
                                    {franchises.map(f => <option key={f.id} value={f.id} className="p-2 border-b border-white/5">{f.name}</option>)}
                                </select>
                            </div>

                            <Button onClick={submitTripSheet} className="w-full bg-primary text-black font-black h-14 rounded-2xl mt-4 shadow-xl shadow-primary/20">
                                SAVE TRIP SHEET
                            </Button>
                        </CardContent>
                    </Card>

                    {/* SCANNER & ITEM LIST */}
                    <div className="lg:col-span-8 space-y-6">
                        <input
                            ref={hiddenInputRef}
                            type="text"
                            className="fixed -top-10 opacity-0"
                            onKeyDown={e => { if(e.key === "Enter") { handleAddOrder(e.target.value); e.target.value = ""; }}}
                            autoFocus
                        />

                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-primary uppercase flex items-center gap-2">
                                <Scan size={16} /> 2. Barcode Scanning
                            </h2>
                            <Button onClick={toggleCamera} variant="outline" className="h-9 border-white/10 bg-white/5 rounded-xl">
                                {isScanning ? <StopCircle size={16} className="mr-2"/> : <Maximize size={16} className="mr-2"/>}
                                {isScanning ? "Stop Camera" : "Camera Scan"}
                            </Button>
                        </div>

                        {isScanning && <div id="trip-scan-region" className="rounded-3xl overflow-hidden border-2 border-primary" />}

                        <Card className="bg-[#121212] border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Shipment Manifest</span>
                                <span className="bg-primary text-black text-[10px] font-black px-3 py-1 rounded-full">{formData.barcodes.length} ITEMS</span>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="text-[10px] text-gray-500 uppercase font-bold sticky top-0 bg-[#121212] border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Order Details</th>
                                            <th className="px-6 py-4">Destination</th>
                                            <th className="px-6 py-4">Load Info</th>
                                            <th className="px-6 py-4 text-center">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {formData.scannedItems.length > 0 ? (
                                            formData.scannedItems.map((item, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold">{item.order_number}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase">{item.payment_method}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <div className="font-bold">{item.consignee?.city}</div>
                                                        <div className="text-gray-500">{item.consignee?.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <div className="font-bold">{item.weight_summary?.total_weight_kg} kg</div>
                                                        <div className="text-gray-500">{item.weight_summary?.total_boxes} boxes</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button 
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    barcodes: prev.barcodes.filter(b => b !== item.order_number),
                                                                    scannedItems: prev.scannedItems.filter(s => s.order_number !== item.order_number)
                                                                }));
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-32 text-center">
                                                    <div className="opacity-10 mb-4 flex justify-center"><Scan size={64}/></div>
                                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">Ready for barcode input</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                /* TRIP LOG VIEW */
                <Card className="bg-[#121212] border-white/10 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] text-gray-500 uppercase font-bold border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Driver & Vehicle</th>
                                    <th className="px-6 py-4">Destination</th>
                                    <th className="px-6 py-4">Consignment Stats</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tripSheets.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary italic font-black">
                                                    {trip.vehicle?.plate_number.slice(-2)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold">{trip.vehicle?.plate_number}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{trip.driver?.first_name} {trip.driver?.last_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold">{trip.destination_franchise?.name}</div>
                                            <div className="text-[10px] text-primary uppercase font-bold tracking-wider">KERALA ROUTE</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold">{trip.total_packages} Packages</div>
                                            <div className="text-[10px] text-gray-500 italic">Total: ₹{trip.total_freight?.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] text-gray-400">
                                            {new Date(trip.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={async () => {
                                                    const res = await fetchTripSheetDetailsApi(trip.id);
                                                    setSelectedTripDetails(res);
                                                }} className="p-2 text-gray-400 hover:text-primary transition-colors"><Eye size={18} /></button>
                                                <button onClick={async () => {
                                                    if(window.confirm("Delete Trip Sheet?")) {
                                                        await deleteTripSheetApi(trip.id);
                                                        toast.success("Deleted");
                                                        dispatch(getTripSheets({ page: 1 }));
                                                    }
                                                }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* DETAILS MODAL */}
            {selectedTripDetails && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
                    <div className="bg-[#121212] border border-white/10 w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl my-8">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Manifest Details</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">TRIP ID: {selectedTripDetails.id}</p>
                            </div>
                            <button onClick={() => setSelectedTripDetails(null)} className="p-3 hover:bg-white/10 rounded-full text-gray-400">
                                <X size={28} />
                            </button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                    <label className="text-[10px] font-bold text-primary uppercase">Driver</label>
                                    <div className="font-bold text-xl mt-1">{selectedTripDetails.driver?.first_name} {selectedTripDetails.driver?.last_name}</div>
                                    <div className="text-sm text-gray-400">{selectedTripDetails.driver?.phone}</div>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                    <label className="text-[10px] font-bold text-primary uppercase">Vehicle</label>
                                    <div className="font-bold text-xl mt-1">{selectedTripDetails.vehicle?.plate_number}</div>
                                    <div className="text-sm text-gray-400 uppercase">{selectedTripDetails.vehicle?.make} • {selectedTripDetails.vehicle?.model}</div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 space-y-6">
                                <div className="flex items-center gap-4 bg-white/5 p-6 rounded-3xl">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase">From</div>
                                        <div className="font-bold text-sm">{selectedTripDetails.franchise?.name}</div>
                                    </div>
                                    <ChevronRight className="text-primary" />
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase">To</div>
                                        <div className="font-bold text-sm">{selectedTripDetails.destination_franchise?.name}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shipment Breakdown</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedTripDetails.orders?.map((o, idx) => (
                                            <div key={idx} className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 text-xs hover:bg-white/10 transition-all">
                                                <div className="flex gap-4 items-center">
                                                    <span className="font-black text-primary italic w-6">#{o.sl_no}</span>
                                                    <div>
                                                        <div className="font-bold">{o.order_number}</div>
                                                        <div className="text-[10px] text-gray-500">{o.consignee?.city}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">₹{o.total_freight}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{o.payment_method}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}