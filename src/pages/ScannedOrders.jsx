import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    RotateCcw, Loader2, Maximize, StopCircle, MapPin, PackageSearch, Scan, 
    Usb, Box, Trash2, Eye, X, CheckCircle2, IndianRupee, Scale, RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi,
    deleteScannedOrderApi,
    fetchDateWiseAddressesApi,
    fetchOrderDetailsApi,
    captureLocationApi,
    getLocationStatusApi,
    resetLocationApi 
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";
import { cn } from "../lib/utils";

// --- Detail Modal Component ---
const OrderDetailModal = ({ orderNumber, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getDetails = async () => {
            try {
                const res = await fetchOrderDetailsApi(orderNumber);
                if (res) setDetails(res);
            } catch (err) {
                toast.error("Failed to load details");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        getDetails();
    }, [orderNumber, onClose]);

    if (loading) return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (!details) return null;
    const { order, pickup_address, consignee, items } = details;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#121212] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl my-8">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase">Order: {order.order_number}</h2>
                        <p className="text-[10px] text-gray-500 font-mono">{order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-black mb-2 uppercase">Official Barcode</p>
                            <img src={`data:image/png;base64,${order.barcode}`} alt="Barcode" className="w-full h-auto" />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                            <label className="text-[10px] font-bold text-primary uppercase">Status</label>
                            <div className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-primary" /> {order.status}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Destination</h4>
                                <p className="text-sm font-bold text-white">{consignee.name}</p>
                                <p className="text-xs text-gray-400">{consignee.city}, {consignee.state}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Origin</h4>
                                <p className="text-sm font-bold text-white">{pickup_address?.nickname || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-[10px] font-bold text-gray-400 uppercase">
                                    <tr><th className="p-3">Item</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Total</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-3 text-white">{item.product_name}</td>
                                            <td className="p-3 text-center text-gray-400">{item.qty}</td>
                                            <td className="p-3 text-right text-primary font-bold">₹{item.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ScannedOrders() {
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedOrderNum, setSelectedOrderNum] = useState(null);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
    
    // Workflow States
    const [isLocationCaptured, setIsLocationCaptured] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [initStatus, setInitStatus] = useState("Acquiring GPS Signal...");

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Warehouse",
        location_id: "",
        page: 1,
        limit: 10
    });

    const scannerRef = useRef(null);
    const hiddenInputRef = useRef(null);
    const processingRef = useRef(false);
    const lastScanned = useRef({ code: "", time: 0 });
    const watchIdRef = useRef(null);
    const isCapturingRef = useRef(false);

    // --- 1. CORE CAPTURE LOGIC (Handles "Already Captured" error as success) ---
    const performCapture = async (lat, lng) => {
        if (isCapturingRef.current) return;
        isCapturingRef.current = true;
        
        try {
            setInitStatus("Verifying Location Session...");
            await captureLocationApi({ 
                latitude: Number(lat), 
                longitude: Number(lng) 
            });
            setIsLocationCaptured(true);
            setIsInitializing(false);
            toast.success("Location Verified");
        } catch (err) {
            const errorDetail = err.response?.data?.detail || "";
            
            // IF ALREADY CAPTURED, Proceed anyway!
            if (errorDetail.includes("already captured")) {
                console.log("Location context already exists on server. Proceeding.");
                setIsLocationCaptured(true);
                setIsInitializing(false);
                toast.success("Active Session Restored");
            } else {
                console.error("Capture API Error:", err);
                toast.error("Location Handshake Failed. Retrying...");
            }
        } finally {
            isCapturingRef.current = false;
        }
    };

    // --- 2. RESET LOGIC (Clears server, then re-captures) ---
    const handleResetLocation = async () => {
        const tId = toast.loading("Resetting server context...");
        setIsInitializing(true);
        setIsLocationCaptured(false);
        
        try {
            const statusRes = await getLocationStatusApi();
            await resetLocationApi(statusRes.entity_type, statusRes.entity_id);
            
            setInitStatus("Acquiring fresh coordinates...");
            
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLocation({ lat, lng });
                    await performCapture(lat, lng);
                    toast.success("Session Re-initialized", { id: tId });
                },
                (err) => {
                    toast.error("GPS Error: " + err.message, { id: tId });
                    setIsInitializing(false);
                },
                { enableHighAccuracy: true }
            );
        } catch (err) {
            toast.error("Failed to reset location session", { id: tId });
            setIsInitializing(false);
        }
    };

    // --- 3. AUTO-LOAD GPS WATCH ---
    useEffect(() => {
        if ("geolocation" in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                async (pos) => {
                    const newLat = pos.coords.latitude;
                    const newLng = pos.coords.longitude;

                    // If user moves significantly, show notification
                    if (location.lat && (Math.abs(location.lat - newLat) > 0.0001 || Math.abs(location.lng - newLng) > 0.0001)) {
                        toast("GPS Updated", { icon: '📍', duration: 2000 });
                    }

                    setLocation({ lat: newLat, lng: newLng });

                    // Initial auto-capture attempt
                    if (!isLocationCaptured && !isCapturingRef.current) {
                        await performCapture(newLat, newLng);
                    }
                },
                (err) => {
                    console.error("GPS Watch Error:", err);
                    setInitStatus("GPS Error: " + err.message);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [isLocationCaptured, location.lat, location.lng]);

    // --- 4. DATA FETCHING ---
    const loadScannedOrders = useCallback(async () => {
        if (!isLocationCaptured) return;
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi(filters);
            setOrders(res?.orders || []);
            setPagination(res?.pagination || { page: 1, total_pages: 1 });
        } catch (error) {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [filters, isLocationCaptured]);

    const loadAddresses = useCallback(async () => {
        if (!isLocationCaptured) return;
        try {
            const res = await fetchDateWiseAddressesApi({
                date: filters.date,
                status: filters.status
            });
            if (res?.success) setAddresses(res.addresses || []);
        } catch (error) {
            setAddresses([]);
        }
    }, [filters.date, filters.status, isLocationCaptured]);

    useEffect(() => { loadScannedOrders(); }, [loadScannedOrders]);
    useEffect(() => { loadAddresses(); }, [loadAddresses]);

    // --- SCANNER HANDLERS ---
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || processingRef.current || !isLocationCaptured) return;

        const cleanCode = decodedText.trim().replace(/["\n\r\t\s+]/g, "").split("/").pop();
        const now = Date.now();
        if (lastScanned.current.code === cleanCode && (now - lastScanned.current.time) < 2000) return;

        processingRef.current = true;
        lastScanned.current = { code: cleanCode, time: now };
        const tId = toast.loading(`Logging ${cleanCode}...`);
        
        try {
            await getOrderPincodeApi(cleanCode, location.lat, location.lng);
            toast.success(`Order ${cleanCode} Logged`, { id: tId });
            loadScannedOrders();
            loadAddresses();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Logging failed", { id: tId });
        } finally {
            processingRef.current = false;
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
                hiddenInputRef.current.focus();
            }
        }
    };

    useEffect(() => {
        const keepFocus = setInterval(() => {
            if (hiddenInputRef.current && 
                document.activeElement.tagName !== "INPUT" && 
                document.activeElement.tagName !== "SELECT") {
                hiddenInputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(keepFocus);
    }, []);

    const toggleCameraScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) await scannerRef.current.stop();
            setIsScanning(false);
            return;
        }
        setIsScanning(true);
        setTimeout(async () => {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            await html5QrCode.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, handleScanSuccess);
        }, 300);
    };

    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">{initStatus}</p>
                {location.lat && (
                    <div className="mt-4 text-[10px] text-gray-500">
                        GPS Active: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-[#09090b] min-h-screen text-white">
            <input ref={hiddenInputRef} type="text" className="fixed -top-10 opacity-0 pointer-events-none"
                onKeyDown={(e) => { if (e.key === "Enter") { handleScanSuccess(e.target.value); e.target.value = ""; } }}
                autoFocus />

            {selectedOrderNum && <OrderDetailModal orderNumber={selectedOrderNum} onClose={() => setSelectedOrderNum(null)} />}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Scan className="text-primary" /> Multi-Point Scan Log</h1>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded uppercase">
                            <Usb size={12} /> Scanner Active
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-primary" /> 
                                GPS: {location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}
                            </div>
                            <button 
                                onClick={handleResetLocation}
                                className="flex items-center gap-1 text-primary hover:text-white hover:bg-primary transition-all bg-primary/10 px-2 py-1 rounded"
                            >
                                <RefreshCw size={10} /> Reset Session
                            </button>
                        </div>
                    </div>
                </div>

                <Button 
                    onClick={toggleCameraScanner} 
                    className={cn("h-11 px-8 rounded-xl font-bold transition-all", isScanning ? "bg-red-600" : "bg-primary text-black")}
                >
                    {isScanning ? <StopCircle size={18} className="mr-2" /> : <Maximize size={18} className="mr-2" />}
                    {isScanning ? "Stop Camera" : "Mobile Camera Scan"}
                </Button>
            </div>

            {isScanning && <div id="reader" className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-primary mb-6 bg-black" />}

            <Card className="bg-[#121212] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-5 bg-white/5 border-b border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Scan Date</label>
                            <input type="date" className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none" value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, page: 1 }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                            <select className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer" value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, location_id: "", page: 1 }))}>
                                <option value="Picked">Picked</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Target Location</label>
                            <select className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white" value={filters.location_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, location_id: e.target.value, page: 1 }))}>
                                <option value="">All Points</option>
                                {addresses.map((addr) => (
                                    <option key={addr.id} value={addr.id}>{addr.nickname || addr.name} ({addr.city})</option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={loadScannedOrders} className="bg-white/5 text-white text-xs h-10 border border-white/10 rounded-xl transition-all hover:bg-white/10">
                            <RotateCcw size={14} className="mr-2" /> Refresh
                        </Button>
                    </div>

                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10"><Loader2 className="animate-spin text-primary" size={40} /></div>}
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-500 text-[10px] font-bold uppercase border-b border-white/10">
                                <tr><th className="px-6 py-4">Order Details</th><th className="px-6 py-4">Package Info</th><th className="px-6 py-4">Scan Point</th><th className="px-6 py-4 text-center">Action</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.length > 0 ? orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white group-hover:text-primary">{order.order_number}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">{order.consignee?.name} • {order.consignee?.city}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-300">
                                                    <Scale size={12} className="text-primary"/> {order.total_weight_kg}kg <Box size={12} className="text-primary"/> {order.total_boxes} Pkts
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><IndianRupee size={10}/> {order.order_value}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-primary uppercase mb-1">{order.status}</div>
                                            <div className="text-xs text-gray-400 font-mono">{new Date(order.updated_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setSelectedOrderNum(order.order_number)} className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Eye size={18} /></button>
                                                <button onClick={async () => { if (window.confirm("Revert?")) { await deleteScannedOrderApi(order.id); loadScannedOrders(); } }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center text-xs font-bold text-gray-600 uppercase tracking-widest">No scans recorded</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={pagination.page} totalPages={pagination.total_pages} onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))} />
                </CardContent>
            </Card>
        </div>
    );
}